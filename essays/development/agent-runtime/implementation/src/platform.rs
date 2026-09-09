#[cfg(any(windows, not(any(unix, windows))))]
use crate::ErrorCode;
use crate::RuntimeError;

#[cfg(unix)]
pub fn local_process_subject() -> Result<String, RuntimeError> {
    let uid = unsafe { libc::geteuid() };
    Ok(format!("unix:{uid}"))
}

#[cfg(windows)]
pub fn local_process_subject() -> Result<String, RuntimeError> {
    windows::process_token_user_sid().map(|sid| format!("windows:{sid}"))
}

#[cfg(not(any(unix, windows)))]
pub fn local_process_subject() -> Result<String, RuntimeError> {
    Err(RuntimeError::new(
        ErrorCode::Unauthenticated,
        "local process identity is unsupported on this platform",
    ))
}

#[cfg(windows)]
mod windows {
    use super::*;
    use std::{
        mem::{MaybeUninit, size_of},
        ptr,
    };
    use windows_sys::Win32::{
        Foundation::{CloseHandle, HANDLE},
        Security::{
            GetLengthSid, GetTokenInformation, IsValidSid, TOKEN_QUERY, TOKEN_USER, TokenUser,
        },
        System::Threading::{GetCurrentProcess, OpenProcessToken},
    };

    struct OwnedHandle(HANDLE);

    impl Drop for OwnedHandle {
        fn drop(&mut self) {
            unsafe {
                CloseHandle(self.0);
            }
        }
    }

    pub(super) fn process_token_user_sid() -> Result<String, RuntimeError> {
        unsafe {
            let mut raw_token = ptr::null_mut();
            if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut raw_token) == 0 {
                return Err(identity_error("open process token"));
            }
            let token = OwnedHandle(raw_token);

            let mut required = 0_u32;
            GetTokenInformation(token.0, TokenUser, ptr::null_mut(), 0, &mut required);
            if required < size_of::<TOKEN_USER>() as u32 {
                return Err(identity_error("size process token user"));
            }

            let word_count = (required as usize).div_ceil(size_of::<usize>());
            let mut buffer = vec![MaybeUninit::<usize>::uninit(); word_count];
            if GetTokenInformation(
                token.0,
                TokenUser,
                buffer.as_mut_ptr().cast(),
                required,
                &mut required,
            ) == 0
            {
                return Err(identity_error("read process token user"));
            }

            let token_user = &*buffer.as_ptr().cast::<TOKEN_USER>();
            if IsValidSid(token_user.User.Sid) == 0 {
                return Err(identity_failure("process token returned an invalid SID"));
            }
            sid_string(
                token_user.User.Sid.cast(),
                GetLengthSid(token_user.User.Sid) as usize,
            )
        }
    }

    unsafe fn sid_string(sid: *const u8, sid_len: usize) -> Result<String, RuntimeError> {
        if sid.is_null() {
            return Err(identity_failure("process token returned a null SID"));
        }
        if sid_len < 8 {
            return Err(identity_failure("process token returned a truncated SID"));
        }
        let revision = unsafe { *sid };
        let sub_authority_count = unsafe { *sid.add(1) } as usize;
        if revision == 0 || sub_authority_count > 15 {
            return Err(identity_failure("process token returned an invalid SID"));
        }
        if sid_len < 8 + sub_authority_count * size_of::<u32>() {
            return Err(identity_failure("process token returned a truncated SID"));
        }

        let authority_bytes = unsafe { std::slice::from_raw_parts(sid.add(2), 6) };
        let authority = authority_bytes
            .iter()
            .fold(0_u64, |value, byte| (value << 8) | u64::from(*byte));
        let mut value = format!("S-{revision}-{authority}");
        for index in 0..sub_authority_count {
            let offset = 8 + index * size_of::<u32>();
            let part = unsafe { ptr::read_unaligned(sid.add(offset).cast::<u32>()) };
            value.push_str(&format!("-{part}"));
        }
        Ok(value)
    }

    fn identity_error(operation: &str) -> RuntimeError {
        RuntimeError::new(
            ErrorCode::Unauthenticated,
            format!(
                "cannot derive verified Windows process-token identity ({operation}): {}",
                std::io::Error::last_os_error()
            ),
        )
    }

    fn identity_failure(message: &str) -> RuntimeError {
        RuntimeError::new(ErrorCode::Unauthenticated, message)
    }
}
