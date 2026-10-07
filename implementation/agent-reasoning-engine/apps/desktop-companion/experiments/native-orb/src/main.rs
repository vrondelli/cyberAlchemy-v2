use slint::ComponentHandle;
use std::cell::RefCell;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::rc::Rc;

#[cfg(windows)]
mod single_instance {
    use std::ffi::c_void;
    use std::path::Path;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::thread::{self, JoinHandle};

    const ERROR_ALREADY_EXISTS: u32 = 183;
    const EVENT_MODIFY_STATE: u32 = 0x0002;
    const WAIT_OBJECT_0: u32 = 0;
    const INFINITE: u32 = u32::MAX;

    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn CreateMutexW(
            attributes: *const c_void,
            initial_owner: i32,
            name: *const u16,
        ) -> *mut c_void;
        fn CreateEventW(
            attributes: *const c_void,
            manual_reset: i32,
            initial_state: i32,
            name: *const u16,
        ) -> *mut c_void;
        fn OpenEventW(desired_access: u32, inherit_handle: i32, name: *const u16) -> *mut c_void;
        fn SetEvent(handle: *mut c_void) -> i32;
        fn WaitForSingleObject(handle: *mut c_void, milliseconds: u32) -> u32;
        fn GetLastError() -> u32;
        fn CloseHandle(handle: *mut c_void) -> i32;
    }

    pub struct Guard {
        mutex: *mut c_void,
        activation_event: *mut c_void,
    }

    pub struct Listener {
        stopping: Arc<AtomicBool>,
        thread: JoinHandle<()>,
    }

    fn names(dashboard: Option<&Path>) -> (Vec<u16>, Vec<u16>) {
        // Distinguish side-by-side installs so a new installer does not signal
        // an orb that still belongs to an older executable and dashboard.
        let identity = dashboard
            .and_then(|path| path.canonicalize().ok())
            .or_else(|| dashboard.map(Path::to_path_buf))
            .map(|path| path.to_string_lossy().to_lowercase())
            .unwrap_or_else(|| "standalone".to_string());
        let hash = identity
            .bytes()
            .fold(0xcbf29ce484222325_u64, |value, byte| {
                (value ^ u64::from(byte)).wrapping_mul(0x100000001b3)
            });
        let name = |kind| {
            format!("Local\\CyberAlchemyARECompanionNativeOrb-{kind}-v2-{hash:016x}")
                .encode_utf16()
                .chain(std::iter::once(0))
                .collect()
        };
        (name("Mutex"), name("Activate"))
    }

    impl Guard {
        pub fn acquire(dashboard: Option<&Path>) -> Result<Option<Self>, String> {
            let (mutex_name, event_name) = names(dashboard);
            // A session-local mutex prevents two desktop icons from owning
            // independent dashboard children. It is not an authority boundary.
            let (handle, error) = unsafe {
                let handle = CreateMutexW(std::ptr::null(), 0, mutex_name.as_ptr());
                (handle, GetLastError())
            };
            if handle.is_null() {
                return Err(format!(
                    "Native orb single-instance guard failed: {}",
                    std::io::Error::from_raw_os_error(error as i32)
                ));
            }
            if error == ERROR_ALREADY_EXISTS {
                unsafe { CloseHandle(handle) };
                // The first process creates the event immediately after its
                // mutex. A short bounded retry covers that startup interval.
                for _ in 0..40 {
                    let event = unsafe { OpenEventW(EVENT_MODIFY_STATE, 0, event_name.as_ptr()) };
                    if !event.is_null() {
                        let signaled = unsafe { SetEvent(event) };
                        let signal_error = std::io::Error::last_os_error();
                        unsafe { CloseHandle(event) };
                        if signaled == 0 {
                            return Err(format!("Native orb activation failed: {signal_error}"));
                        }
                        return Ok(None);
                    }
                    thread::sleep(std::time::Duration::from_millis(25));
                }
                return Err("Existing native orb did not expose its activation event".into());
            }
            let event = unsafe { CreateEventW(std::ptr::null(), 0, 0, event_name.as_ptr()) };
            if event.is_null() {
                let error = std::io::Error::last_os_error();
                unsafe { CloseHandle(handle) };
                return Err(format!("Native orb activation event failed: {error}"));
            }
            Ok(Some(Self {
                mutex: handle,
                activation_event: event,
            }))
        }

        pub fn listen(&self, orb: slint::Weak<super::NativeOrb>) -> Listener {
            let stopping = Arc::new(AtomicBool::new(false));
            let thread_stopping = Arc::clone(&stopping);
            let event = self.activation_event as usize;
            let thread = thread::spawn(move || {
                loop {
                    let result = unsafe { WaitForSingleObject(event as *mut c_void, INFINITE) };
                    if thread_stopping.load(Ordering::Acquire) {
                        break;
                    }
                    if result != WAIT_OBJECT_0 {
                        eprintln!(
                            "Native orb activation wait failed: {}",
                            std::io::Error::last_os_error()
                        );
                        break;
                    }
                    if orb
                        .upgrade_in_event_loop(|handle| handle.invoke_activated())
                        .is_err()
                    {
                        break;
                    }
                }
            });
            Listener { stopping, thread }
        }

        pub fn stop(&self, listener: Listener) {
            listener.stopping.store(true, Ordering::Release);
            unsafe { SetEvent(self.activation_event) };
            let _ = listener.thread.join();
        }
    }

    impl Drop for Guard {
        fn drop(&mut self) {
            unsafe {
                CloseHandle(self.activation_event);
                CloseHandle(self.mutex);
            }
        }
    }
}

#[cfg(target_os = "linux")]
mod linux_instance {
    use std::io::{Read, Write};
    use std::os::linux::net::SocketAddrExt;
    use std::os::unix::net::{SocketAddr, UnixListener, UnixStream};
    use std::path::Path;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::thread::{self, JoinHandle};
    use std::time::Duration;

    unsafe extern "C" {
        fn geteuid() -> u32;
    }

    pub struct Guard {
        address: SocketAddr,
        listener: UnixListener,
    }

    pub struct Listener {
        address: SocketAddr,
        stopping: Arc<AtomicBool>,
        thread: JoinHandle<()>,
    }

    fn address(dashboard: Option<&Path>) -> Result<SocketAddr, String> {
        let dashboard = dashboard
            .and_then(|path| path.canonicalize().ok())
            .or_else(|| dashboard.map(Path::to_path_buf))
            .map(|path| path.to_string_lossy().into_owned())
            .unwrap_or_else(|| "standalone".to_string());
        let session = format!(
            "{dashboard}|{}|{}|{}|{}",
            std::env::var("XDG_RUNTIME_DIR").unwrap_or_default(),
            std::env::var("DISPLAY").unwrap_or_default(),
            std::env::var("WAYLAND_DISPLAY").unwrap_or_default(),
            std::env::var("XDG_SESSION_ID").unwrap_or_default(),
        );
        let hash = session.bytes().fold(0xcbf29ce484222325_u64, |value, byte| {
            (value ^ u64::from(byte)).wrapping_mul(0x100000001b3)
        });
        let uid = unsafe { geteuid() };
        let name = format!("are-companion-native-orb-v1-{uid}-{hash:016x}");
        SocketAddr::from_abstract_name(name.as_bytes())
            .map_err(|error| format!("Native orb activation address failed: {error}"))
    }

    impl Guard {
        pub fn acquire(dashboard: Option<&Path>) -> Result<Option<Self>, String> {
            let address = address(dashboard)?;
            for _ in 0..40 {
                match UnixListener::bind_addr(&address) {
                    Ok(listener) => return Ok(Some(Self { address, listener })),
                    Err(error) if error.kind() == std::io::ErrorKind::AddrInUse => {
                        match UnixStream::connect_addr(&address)
                            .and_then(|mut stream| stream.write_all(b"A"))
                        {
                            Ok(()) => return Ok(None),
                            Err(error)
                                if matches!(
                                    error.kind(),
                                    std::io::ErrorKind::ConnectionRefused
                                        | std::io::ErrorKind::NotFound
                                        | std::io::ErrorKind::BrokenPipe
                                ) =>
                            {
                                thread::sleep(Duration::from_millis(25));
                            }
                            Err(error) => {
                                return Err(format!("Native orb activation failed: {error}"));
                            }
                        }
                    }
                    Err(error) => {
                        return Err(format!("Native orb single-instance bind failed: {error}"));
                    }
                }
            }
            Err("Native orb activation did not settle within one second".into())
        }

        pub fn listen(self, orb: slint::Weak<super::NativeOrb>) -> Listener {
            let stopping = Arc::new(AtomicBool::new(false));
            let thread_stopping = Arc::clone(&stopping);
            let address = self.address;
            let thread = thread::spawn(move || {
                for accepted in self.listener.incoming() {
                    if thread_stopping.load(Ordering::Acquire) {
                        break;
                    }
                    let Ok(mut stream) = accepted else {
                        eprintln!("Native orb activation accept failed");
                        break;
                    };
                    let _ = stream.set_read_timeout(Some(Duration::from_secs(1)));
                    let mut command = [0u8; 1];
                    if stream.read_exact(&mut command).is_ok() && command[0] == b'A' {
                        if orb
                            .upgrade_in_event_loop(|handle| handle.invoke_activated())
                            .is_err()
                        {
                            break;
                        }
                    }
                }
            });
            Listener {
                address,
                stopping,
                thread,
            }
        }
    }

    impl Listener {
        pub fn stop(self) {
            self.stopping.store(true, Ordering::Release);
            if let Ok(mut stream) = UnixStream::connect_addr(&self.address) {
                let _ = stream.write_all(b"Q");
            }
            let _ = self.thread.join();
        }
    }
}

slint::slint! {
    export component NativeOrb inherits Window {
        in property <string> skin: "verdant";
        in property <bool> manual-drag: false;
        callback activated();
        callback drag-requested(float, float);

        title: "ARE Companion native orb experiment";
        width: 84px;
        height: 84px;
        no-frame: true;
        always-on-top: true;
        background: transparent;
        forward-focus: orb-focus;

        orb-focus := FocusScope {
            accessible-role: button;
            accessible-label: "Open ARE dashboard";
            accessible-id: "are-native-orb";
            accessible-action-default => { root.activated(); }
            key-pressed(event) => {
                if (event.text == Key.Return || event.text == Key.Space) {
                    root.activated();
                    accept
                } else {
                    reject
                }
            }

            WindowMoveArea {
                enabled: !root.manual-drag;
                Rectangle {
                    x: 4px;
                    y: 4px;
                    width: 76px;
                    height: 76px;
                    border-radius: 38px;
                    background: root.skin == "cobalt" ? #244d86 : root.skin == "ember" ? #a94d35 : #176755;
                    border-color: orb-focus.has-focus ? white : root.skin == "cobalt" ? #8fc6ff : root.skin == "ember" ? #ffc49a : #a4f1c9;
                    border-width: orb-focus.has-focus ? 3px : 2px;

                    Text {
                        text: "ARE";
                        color: white;
                        font-weight: 700;
                        font-size: 18px;
                        horizontal-alignment: center;
                        vertical-alignment: center;
                    }
                }

                orb-touch := TouchArea {
                    property <bool> dragged: false;
                    pointer-event(event) => {
                        if (event.kind == PointerEventKind.down) {
                            self.dragged = false;
                        }
                    }
                    moved => {
                        if (root.manual-drag && self.pressed) {
                            if (self.mouse-x - self.pressed-x > 6px || self.pressed-x - self.mouse-x > 6px
                                || self.mouse-y - self.pressed-y > 6px || self.pressed-y - self.mouse-y > 6px) {
                                self.dragged = true;
                                root.drag-requested((self.mouse-x - self.pressed-x) / 1px,
                                                    (self.mouse-y - self.pressed-y) / 1px);
                            }
                        }
                    }
                    clicked => { if (!self.dragged) { root.activated(); } }
                }
            }
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
enum AppearanceMessage {
    Skin(&'static str),
    Position(i32, i32),
}

fn appearance_from_line(line: &[u8]) -> Option<AppearanceMessage> {
    match line {
        b"ARE_COMPANION_ORB_SKIN verdant" => return Some(AppearanceMessage::Skin("verdant")),
        b"ARE_COMPANION_ORB_SKIN cobalt" => return Some(AppearanceMessage::Skin("cobalt")),
        b"ARE_COMPANION_ORB_SKIN ember" => return Some(AppearanceMessage::Skin("ember")),
        _ => {}
    }
    let coordinates = std::str::from_utf8(line)
        .ok()?
        .strip_prefix("ARE_COMPANION_ORB_POSITION ")?;
    let (x_text, y_text) = coordinates.split_once(' ')?;
    let x = x_text.parse::<i32>().ok()?;
    let y = y_text.parse::<i32>().ok()?;
    if x.to_string() != x_text || y.to_string() != y_text {
        return None;
    }
    if !(-100_000..=100_000).contains(&x) || !(-100_000..=100_000).contains(&y) {
        return None;
    }
    Some(AppearanceMessage::Position(x, y))
}

fn follow_dashboard_appearance(
    mut output: impl Read + Send + 'static,
    orb: slint::Weak<NativeOrb>,
) {
    std::thread::spawn(move || {
        let mut line = [0u8; 64];
        let mut used = 0;
        let mut overflow = false;
        loop {
            let mut byte = [0u8; 1];
            match output.read(&mut byte) {
                Ok(0) => break,
                Ok(_) if byte[0] == b'\n' => {
                    if !overflow {
                        match appearance_from_line(&line[..used]) {
                            Some(AppearanceMessage::Skin(skin)) => {
                                let _ = orb.upgrade_in_event_loop(move |handle| {
                                    handle.set_skin(skin.into());
                                    println!("ARE_NATIVE_ORB_SKIN_CHANGED {skin}");
                                });
                            }
                            Some(AppearanceMessage::Position(x, y)) => {
                                let _ = orb.upgrade_in_event_loop(move |handle| {
                                    handle
                                        .window()
                                        .set_position(slint::PhysicalPosition::new(x, y));
                                    println!("ARE_NATIVE_ORB_POSITION_REQUESTED x={x} y={y}");
                                });
                            }
                            None => {}
                        }
                    }
                    used = 0;
                    overflow = false;
                }
                Ok(_) if used < line.len() && !overflow => {
                    line[used] = byte[0];
                    used += 1;
                }
                Ok(_) => overflow = true,
                Err(error) if error.kind() == std::io::ErrorKind::Interrupted => continue,
                Err(error) => {
                    eprintln!("Dashboard appearance channel failed: {error}");
                    break;
                }
            }
        }
    });
}

#[cfg(target_os = "linux")]
fn use_manual_x11_drag(backend: &str, wayland_display: &str, display: &str) -> bool {
    if backend.contains("wayland") || display.is_empty() {
        return false;
    }
    backend.contains("x11") || (wayland_display.is_empty() && !display.is_empty())
}

fn main() -> Result<(), slint::PlatformError> {
    let mut skin = "verdant".to_string();
    let mut dashboard: Option<PathBuf> = None;
    let mut args = std::env::args_os().skip(1);
    while let Some(argument) = args.next() {
        if argument == "--dashboard" {
            dashboard = args.next().map(PathBuf::from);
            if dashboard.is_none() {
                eprintln!("--dashboard requires an executable path");
                std::process::exit(2);
            }
        } else if ["verdant", "cobalt", "ember"]
            .iter()
            .any(|name| argument == *name)
        {
            skin = argument.to_string_lossy().into_owned();
        } else {
            eprintln!(
                "Unknown native orb argument: {}",
                argument.to_string_lossy()
            );
            std::process::exit(2);
        }
    }
    if let Some(path) = &dashboard {
        if !path.is_file() {
            eprintln!("Dashboard executable is unavailable: {}", path.display());
            std::process::exit(2);
        }
    }
    #[cfg(windows)]
    let instance = match single_instance::Guard::acquire(dashboard.as_deref()) {
        Ok(Some(guard)) => guard,
        Ok(None) => return Ok(()),
        Err(error) => {
            eprintln!("{error}");
            std::process::exit(2);
        }
    };
    #[cfg(target_os = "linux")]
    let instance = match linux_instance::Guard::acquire(dashboard.as_deref()) {
        Ok(Some(guard)) => guard,
        Ok(None) => return Ok(()),
        Err(error) => {
            eprintln!("{error}");
            std::process::exit(2);
        }
    };
    let orb = NativeOrb::new()?;
    #[cfg(target_os = "linux")]
    let linux_x11_orb = {
        let requested_backend = std::env::var("SLINT_BACKEND").unwrap_or_default();
        let manual_x11_drag = use_manual_x11_drag(
            &requested_backend,
            &std::env::var("WAYLAND_DISPLAY").unwrap_or_default(),
            &std::env::var("DISPLAY").unwrap_or_default(),
        );
        orb.set_manual_drag(manual_x11_drag);
        let drag_orb = orb.as_weak();
        orb.on_drag_requested(move |dx, dy| {
            let Some(handle) = drag_orb.upgrade() else {
                return;
            };
            let window = handle.window();
            let position = window.position();
            let scale = window.scale_factor();
            window.set_position(slint::PhysicalPosition::new(
                position.x.saturating_add((dx * scale).round() as i32),
                position.y.saturating_add((dy * scale).round() as i32),
            ));
        });
        manual_x11_drag
    };
    if ["verdant", "cobalt", "ember"].contains(&skin.as_str()) {
        orb.set_skin(skin.into());
    }
    let owned_dashboard: Rc<RefCell<Option<Child>>> = Rc::new(RefCell::new(None));
    let activated_dashboard = Rc::clone(&owned_dashboard);
    let appearance_orb = orb.as_weak();
    orb.on_activated(move || {
        println!("ARE_NATIVE_ORB_ACTIVATED");
        let Some(path) = &dashboard else { return };
        let mut child = activated_dashboard.borrow_mut();
        if let Some(existing) = child.as_mut() {
            match existing.try_wait() {
                Ok(None) => {
                    println!("ARE_NATIVE_ORB_DASHBOARD_ALREADY_RUNNING");
                    if let Some(stdin) = existing.stdin.as_mut() {
                        match stdin.write_all(b"focus\n") {
                            Ok(()) => println!("ARE_NATIVE_ORB_DASHBOARD_FOCUS_SENT"),
                            Err(error) => eprintln!("Dashboard focus request failed: {error}"),
                        }
                    }
                    return;
                }
                Ok(Some(_)) => {
                    *child = None;
                }
                Err(error) => {
                    eprintln!("Dashboard status unavailable: {error}");
                    return;
                }
            }
        }
        let mut command = Command::new(path);
        #[cfg(target_os = "linux")]
        if linux_x11_orb {
            // The owned dashboard must use the same global X11 coordinates
            // as the Slint orb before it can calculate placement presets.
            command.env("GDK_BACKEND", "x11");
            command.env("ARE_COMPANION_NATIVE_ORB_BACKEND", "x11");
        }
        match command
            .arg("--dashboard-only")
            .arg("--orb-owned-stdin")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
        {
            Ok(mut started) => {
                println!("ARE_NATIVE_ORB_DASHBOARD_STARTED pid={}", started.id());
                if let Some(output) = started.stdout.take() {
                    follow_dashboard_appearance(output, appearance_orb.clone());
                }
                *child = Some(started);
            }
            Err(error) => eprintln!("Dashboard start failed: {error}"),
        }
    });
    #[cfg(windows)]
    let activation_listener = instance.listen(orb.as_weak());
    #[cfg(target_os = "linux")]
    let activation_listener = instance.listen(orb.as_weak());
    orb.show()?;
    println!("ARE_NATIVE_ORB_READY");
    let result = orb.run();
    #[cfg(windows)]
    instance.stop(activation_listener);
    #[cfg(target_os = "linux")]
    activation_listener.stop();
    if let Some(mut child) = owned_dashboard.borrow_mut().take() {
        if matches!(child.try_wait(), Ok(None)) {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::{AppearanceMessage, appearance_from_line};

    #[cfg(target_os = "linux")]
    #[test]
    fn manual_drag_selects_x11_without_overriding_wayland() {
        assert!(super::use_manual_x11_drag("", "", ":0"));
        assert!(super::use_manual_x11_drag("winit-x11", "wayland-0", ":0"));
        assert!(!super::use_manual_x11_drag("winit-wayland", "", ":0"));
        assert!(!super::use_manual_x11_drag("", "wayland-0", ":0"));
        assert!(!super::use_manual_x11_drag("", "", ""));
        assert!(!super::use_manual_x11_drag("winit-x11", "", ""));
    }

    #[test]
    fn appearance_messages_accept_only_exact_known_skins() {
        assert_eq!(
            appearance_from_line(b"ARE_COMPANION_ORB_SKIN cobalt"),
            Some(AppearanceMessage::Skin("cobalt"))
        );
        assert_eq!(
            appearance_from_line(b"ARE_COMPANION_ORB_SKIN ember"),
            Some(AppearanceMessage::Skin("ember"))
        );
        assert_eq!(
            appearance_from_line(b"ARE_COMPANION_ORB_SKIN verdant"),
            Some(AppearanceMessage::Skin("verdant"))
        );
        assert_eq!(
            appearance_from_line(b"ARE_COMPANION_ORB_SKIN unexpected"),
            None
        );
        assert_eq!(
            appearance_from_line(b"ARE_COMPANION_ORB_SKIN cobalt extra"),
            None
        );
        assert_eq!(appearance_from_line(b"debug cobalt"), None);
    }

    #[test]
    fn position_messages_accept_only_bounded_canonical_coordinates() {
        assert_eq!(
            appearance_from_line(b"ARE_COMPANION_ORB_POSITION -100 250"),
            Some(AppearanceMessage::Position(-100, 250))
        );
        assert_eq!(
            appearance_from_line(b"ARE_COMPANION_ORB_POSITION +1 2"),
            None
        );
        assert_eq!(
            appearance_from_line(b"ARE_COMPANION_ORB_POSITION 1 02"),
            None
        );
        assert_eq!(
            appearance_from_line(b"ARE_COMPANION_ORB_POSITION 100001 0"),
            None
        );
        assert_eq!(
            appearance_from_line(b"ARE_COMPANION_ORB_POSITION 1 2 extra"),
            None
        );
    }
}
