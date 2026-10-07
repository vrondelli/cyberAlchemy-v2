/* Test-only X11 pointer injection for the isolated native-orb experiment. */
#define _POSIX_C_SOURCE 200809L
#include <X11/Xlib.h>
#include <X11/Xatom.h>
#include <X11/Xutil.h>
#include <X11/extensions/XTest.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

static Window find_named(Display *display, Window parent, const char *wanted) {
    char *name = NULL;
    if (XFetchName(display, parent, &name) && name != NULL) {
        int match = strcmp(name, wanted) == 0;
        XFree(name);
        if (match) return parent;
    }
    Window root, owner, *children = NULL;
    unsigned int count = 0;
    if (!XQueryTree(display, parent, &root, &owner, &children, &count)) return None;
    Window found = None;
    for (unsigned int index = 0; index < count && found == None; index++) {
        found = find_named(display, children[index], wanted);
    }
    if (children != NULL) XFree(children);
    return found;
}

static Window find_dashboard(Display *display, Window parent, Atom pid_atom, unsigned long expected_pid) {
    char *name = NULL;
    if (XFetchName(display, parent, &name) && name != NULL) {
        int named = strstr(name, "Observatory") != NULL;
        XFree(name);
        if (named && pid_atom != None) {
            Atom type;
            int format;
            unsigned long count, remaining;
            unsigned char *data = NULL;
            int status = XGetWindowProperty(display, parent, pid_atom, 0, 1, False, XA_CARDINAL,
                                            &type, &format, &count, &remaining, &data);
            int matched = status == Success && type == XA_CARDINAL && format == 32 &&
                          count == 1 && data != NULL && *(unsigned long *)data == expected_pid;
            if (data != NULL) XFree(data);
            if (matched) return parent;
        }
    }
    Window root, owner, *children = NULL;
    unsigned int count = 0;
    if (!XQueryTree(display, parent, &root, &owner, &children, &count)) return None;
    Window found = None;
    for (unsigned int index = 0; index < count && found == None; index++) {
        found = find_dashboard(display, children[index], pid_atom, expected_pid);
    }
    if (children != NULL) XFree(children);
    return found;
}

int main(int argc, char **argv) {
    int dashboard_close = argc == 3 && strcmp(argv[1], "--close-dashboard") == 0;
    int dashboard_resize = argc == 5 && strcmp(argv[1], "--resize-dashboard") == 0;
    int dashboard_capture = argc == 4 && strcmp(argv[1], "--capture-dashboard") == 0;
    int orb_close = argc == 2 && strcmp(argv[1], "--close") == 0;
    int orb_drag = argc == 2 && strcmp(argv[1], "--drag") == 0;
    int orb_move_request = argc == 2 && strcmp(argv[1], "--move-request") == 0;
    int orb_position = argc == 2 && strcmp(argv[1], "--position") == 0;
    int sample_skin = argc == 2 && strcmp(argv[1], "--sample-skin") == 0;
    int assert_skin = argc == 3 && strcmp(argv[1], "--assert-skin") == 0;
    if (!dashboard_close && !dashboard_resize && !dashboard_capture && !orb_close && !orb_drag && !orb_move_request && !orb_position && !sample_skin && !assert_skin && argc != 1) {
        fputs("Usage: test-linux-pointer [--close | --drag | --move-request | --position | --sample-skin | --assert-skin NAME | --close-dashboard PID | --resize-dashboard PID WIDTH HEIGHT | --capture-dashboard PID NEW.ppm]\n", stderr);
        return 2;
    }
    char *pid_end = NULL;
    unsigned long dashboard_pid = (dashboard_close || dashboard_resize || dashboard_capture) ? strtoul(argv[2], &pid_end, 10) : 0;
    if ((dashboard_close || dashboard_resize || dashboard_capture) && (dashboard_pid == 0 || *pid_end != '\0')) {
        fputs("Dashboard PID must be a positive integer\n", stderr);
        return 2;
    }
    unsigned long resize_width = 0, resize_height = 0;
    if (dashboard_resize) {
        resize_width = strtoul(argv[3], &pid_end, 10);
        if (resize_width < 100 || resize_width > 8192 || *pid_end != '\0') {
            fputs("Dashboard resize width is invalid\n", stderr);
            return 2;
        }
        resize_height = strtoul(argv[4], &pid_end, 10);
        if (resize_height < 100 || resize_height > 8192 || *pid_end != '\0') {
            fputs("Dashboard resize height is invalid\n", stderr);
            return 2;
        }
    }
    Display *display = XOpenDisplay(NULL);
    if (display == NULL) {
        fputs("X11 display unavailable\n", stderr);
        return 2;
    }
    if (!XTestQueryExtension(display, &(int){0}, &(int){0}, &(int){0}, &(int){0})) {
        fputs("XTest extension unavailable\n", stderr);
        XCloseDisplay(display);
        return 2;
    }
    Window window = None;
    for (int attempt = 0; attempt < 40 && window == None; attempt++) {
        window = (dashboard_close || dashboard_resize || dashboard_capture)
            ? find_dashboard(display, DefaultRootWindow(display),
                             XInternAtom(display, "_NET_WM_PID", True), dashboard_pid)
            : find_named(display, DefaultRootWindow(display), "ARE Companion native orb experiment");
        if (window == None) nanosleep(&(struct timespec){.tv_nsec = 100000000L}, NULL);
    }
    if (window == None) {
        fputs((dashboard_close || dashboard_resize || dashboard_capture) ? "Owned dashboard window unavailable\n" : "Native orb window unavailable\n", stderr);
        XCloseDisplay(display);
        return 1;
    }
    if (dashboard_resize) {
        XSizeHints hints;
        long supplied = 0;
        if (!XGetWMNormalHints(display, window, &hints, &supplied) || !(hints.flags & PMinSize)) {
            fputs("Dashboard minimum-size hints unavailable\n", stderr);
            XCloseDisplay(display);
            return 1;
        }
        if (hints.min_width > (int)resize_width || hints.min_height > (int)resize_height) {
            fprintf(stderr, "Dashboard minimum-size hints forbid requested size: min=%dx%d requested=%lux%lu\n",
                    hints.min_width, hints.min_height, resize_width, resize_height);
            XCloseDisplay(display);
            return 1;
        }
        XResizeWindow(display, window, (unsigned int)resize_width, (unsigned int)resize_height);
        XSync(display, False);
        printf("owned-dashboard-resize-requested pid=%lu width=%lu height=%lu min_width=%d min_height=%d\n",
               dashboard_pid, resize_width, resize_height, hints.min_width, hints.min_height);
        XCloseDisplay(display);
        return 0;
    }
    if (dashboard_capture) {
        XWindowAttributes image_attributes;
        if (!XGetWindowAttributes(display, window, &image_attributes) ||
            image_attributes.width <= 0 || image_attributes.height <= 0) {
            fputs("Dashboard dimensions unavailable for capture\n", stderr);
            XCloseDisplay(display);
            return 1;
        }
        XImage *image = XGetImage(display, window, 0, 0,
                                 (unsigned int)image_attributes.width,
                                 (unsigned int)image_attributes.height,
                                 AllPlanes, ZPixmap);
        if (image == NULL) {
            fputs("Dashboard pixels unavailable for capture\n", stderr);
            XCloseDisplay(display);
            return 1;
        }
        int descriptor = open(argv[3], O_WRONLY | O_CREAT | O_EXCL, 0600);
        FILE *file = descriptor >= 0 ? fdopen(descriptor, "wb") : NULL;
        if (file == NULL) {
            if (descriptor >= 0) close(descriptor);
            fputs("Dashboard capture target must be a new writable file\n", stderr);
            XDestroyImage(image);
            XCloseDisplay(display);
            return 1;
        }
        fprintf(file, "P6\n%d %d\n255\n", image->width, image->height);
        unsigned long masks[3] = {image->red_mask, image->green_mask, image->blue_mask};
        for (int y = 0; y < image->height; y++) {
            for (int x = 0; x < image->width; x++) {
                unsigned long pixel = XGetPixel(image, x, y);
                for (int channel = 0; channel < 3; channel++) {
                    unsigned long mask = masks[channel];
                    int shift = mask ? __builtin_ctzl(mask) : 0;
                    unsigned long maximum = mask >> shift;
                    unsigned long value = maximum ? ((pixel & mask) >> shift) * 255 / maximum : 0;
                    fputc((int)value, file);
                }
            }
        }
        int write_failed = ferror(file);
        if (fclose(file) != 0) write_failed = 1;
        if (write_failed) {
            fputs("Dashboard capture write failed\n", stderr);
            XDestroyImage(image);
            XCloseDisplay(display);
            return 1;
        }
        printf("owned-dashboard-captured width=%d height=%d path=%s\n",
               image->width, image->height, argv[3]);
        XDestroyImage(image);
        XCloseDisplay(display);
        return 0;
    }
    if (dashboard_close || orb_close) {
        Atom protocol = XInternAtom(display, "WM_PROTOCOLS", False);
        Atom delete_window = XInternAtom(display, "WM_DELETE_WINDOW", False);
        XEvent event = {0};
        event.xclient.type = ClientMessage;
        event.xclient.window = window;
        event.xclient.message_type = protocol;
        event.xclient.format = 32;
        event.xclient.data.l[0] = (long)delete_window;
        event.xclient.data.l[1] = CurrentTime;
        if (!XSendEvent(display, window, False, NoEventMask, &event)) {
            fputs("Could not send window close event\n", stderr);
            XCloseDisplay(display);
            return 1;
        }
        XFlush(display);
        puts(dashboard_close ? "owned-dashboard-close-sent" : "native-orb-close-sent");
        XCloseDisplay(display);
        return 0;
    }
    XWindowAttributes attributes;
    Window unused;
    int x = 0, y = 0, previous_x = 0, previous_y = 0, stable = 0;
    for (int attempt = 0; attempt < 40; attempt++) {
        if (XGetWindowAttributes(display, window, &attributes) &&
            attributes.map_state == IsViewable && attributes.width > 0 && attributes.height > 0 &&
            XTranslateCoordinates(display, window, DefaultRootWindow(display),
                                  attributes.width / 2, attributes.height / 2,
                                  &x, &y, &unused) &&
            abs(x) < 20000 && abs(y) < 20000) {
            stable = abs(x - previous_x) <= 1 && abs(y - previous_y) <= 1 ? stable + 1 : 0;
            if (stable >= 2) break;
            previous_x = x;
            previous_y = y;
        }
        nanosleep(&(struct timespec){.tv_nsec = 100000000L}, NULL);
    }
    if (stable < 2) {
        fputs("Native orb geometry did not settle\n", stderr);
        XCloseDisplay(display);
        return 1;
    }
    if (orb_position) {
        printf("native-orb-position x=%d y=%d width=%d height=%d\n",
               x - attributes.width / 2, y - attributes.height / 2,
               attributes.width, attributes.height);
        XCloseDisplay(display);
        return 0;
    }
    if (sample_skin || assert_skin) {
        int sample_x = attributes.width * 24 / 84;
        int sample_y = attributes.height * 24 / 84;
        XImage *image = XGetImage(display, window, sample_x, sample_y, 1, 1, AllPlanes, ZPixmap);
        if (image == NULL) {
            fputs("Native orb pixel unavailable\n", stderr);
            XCloseDisplay(display);
            return 1;
        }
        XColor color = {.pixel = XGetPixel(image, 0, 0)};
        XDestroyImage(image);
        if (!XQueryColor(display, attributes.colormap, &color)) {
            fputs("Native orb pixel color unavailable\n", stderr);
            XCloseDisplay(display);
            return 1;
        }
        int red = color.red / 257, green = color.green / 257, blue = color.blue / 257;
        printf("native-orb-skin-pixel red=%d green=%d blue=%d\n", red, green, blue);
        if (assert_skin) {
            int expected_red, expected_green, expected_blue;
            if (strcmp(argv[2], "verdant") == 0) {
                expected_red = 23; expected_green = 103; expected_blue = 85;
            } else if (strcmp(argv[2], "cobalt") == 0) {
                expected_red = 36; expected_green = 77; expected_blue = 134;
            } else if (strcmp(argv[2], "ember") == 0) {
                expected_red = 169; expected_green = 77; expected_blue = 53;
            } else {
                fputs("Unknown skin assertion\n", stderr);
                XCloseDisplay(display);
                return 2;
            }
            if (abs(red - expected_red) > 25 || abs(green - expected_green) > 25 ||
                abs(blue - expected_blue) > 25) {
                fputs("Native orb pixel does not match the requested skin\n", stderr);
                XCloseDisplay(display);
                return 1;
            }
        }
        XCloseDisplay(display);
        return 0;
    }
    if (orb_move_request) {
        XMoveWindow(display, window, x - attributes.width / 2 + 80,
                    y - attributes.height / 2 + 56);
        XFlush(display);
    } else {
        XTestFakeMotionEvent(display, DefaultScreen(display), x, y, CurrentTime);
        XTestFakeButtonEvent(display, 1, True, CurrentTime);
    }
    if (orb_drag) {
        XFlush(display);
        nanosleep(&(struct timespec){.tv_nsec = 100000000L}, NULL);
        for (int step = 1; step <= 8; step++) {
            XTestFakeMotionEvent(display, DefaultScreen(display), x + step * 10, y + step * 7, CurrentTime);
            XFlush(display);
            nanosleep(&(struct timespec){.tv_nsec = 40000000L}, NULL);
        }
    }
    if (!orb_move_request) XTestFakeButtonEvent(display, 1, False, CurrentTime);
    XFlush(display);
    if (orb_drag || orb_move_request) {
        int moved_x = x, moved_y = y;
        for (int attempt = 0; attempt < 30; attempt++) {
            XSync(display, False);
            if (XTranslateCoordinates(display, window, DefaultRootWindow(display),
                                      attributes.width / 2, attributes.height / 2,
                                      &moved_x, &moved_y, &unused) &&
                (abs(moved_x - x) >= 16 || abs(moved_y - y) >= 16)) {
                printf("native-orb-%s start=%d,%d end=%d,%d\n",
                       orb_drag ? "drag" : "move-request", x, y, moved_x, moved_y);
                XCloseDisplay(display);
                return 0;
            }
            nanosleep(&(struct timespec){.tv_nsec = 100000000L}, NULL);
        }
        fprintf(stderr, "Native orb did not move after X11 %s: start=%d,%d end=%d,%d\n",
                orb_drag ? "drag" : "move request", x, y, moved_x, moved_y);
        XCloseDisplay(display);
        return 1;
    }
    printf("native-orb-click x=%d y=%d\n", x, y);
    XCloseDisplay(display);
    return 0;
}
