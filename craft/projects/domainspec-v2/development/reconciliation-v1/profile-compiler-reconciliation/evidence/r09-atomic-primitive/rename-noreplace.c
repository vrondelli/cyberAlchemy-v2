/* R09 isolated prototype. Not installed or called by the CLI. */
#define _GNU_SOURCE
#include <node_api.h>
#include <errno.h>
#include <fcntl.h>
#include <limits.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>

static napi_value reject(napi_env env, const char *code, const char *message) {
  napi_throw_error(env, code, message);
  return NULL;
}

static int leaf(napi_env env, napi_value value, char output[256]) {
  size_t length = 0;
  if (napi_get_value_string_utf8(env, value, NULL, 0, &length) != napi_ok ||
      length == 0 || length > 255) return 0;
  if (napi_get_value_string_utf8(env, value, output, 256, &length) != napi_ok) return 0;
  return memchr(output, '\0', length) == NULL && memchr(output, '/', length) == NULL &&
         !(length == 1 && output[0] == '.') &&
         !(length == 2 && output[0] == '.' && output[1] == '.');
}

static const char *error_code(int error) {
  switch (error) {
    case EEXIST: return "EEXIST";
    case ENOTEMPTY: return "ENOTEMPTY";
    case EINVAL: return "EINVAL";
    case EBADF: return "EBADF";
    case ENOTDIR: return "ENOTDIR";
    case ENOENT: return "ENOENT";
    case EACCES: return "EACCES";
    case EPERM: return "EPERM";
    case ENOSYS: return "ENOSYS";
    case EXDEV: return "EXDEV";
    case EOPNOTSUPP: return "EOPNOTSUPP";
    default: return "R09_RENAME_FAILED";
  }
}

static napi_value rename_no_replace(napi_env env, napi_callback_info info) {
  napi_value args[4]; size_t argc = 4; double raw_fd;
  char source[256], target[256]; struct stat parent;
  if (napi_get_cb_info(env, info, &argc, args, NULL, NULL) != napi_ok || argc != 3 ||
      napi_get_value_double(env, args[0], &raw_fd) != napi_ok ||
      !(raw_fd >= 0 && raw_fd <= INT_MAX) || raw_fd != (int)raw_fd ||
      !leaf(env, args[1], source) || !leaf(env, args[2], target))
    return reject(env, "R09_ARGUMENT", "expected a directory descriptor and two nonempty leaf names");
  const int fd = (int)raw_fd;
  if (fstat(fd, &parent) != 0) return reject(env, error_code(errno), "cannot inspect parent descriptor");
  if (!S_ISDIR(parent.st_mode)) return reject(env, "ENOTDIR", "parent descriptor is not a directory");
  /* No check-then-rename and no fallback: unsupported kernels/filesystems fail. */
  if (renameat2(fd, source, fd, target, RENAME_NOREPLACE) != 0) {
    const int error = errno;
    return reject(env, error_code(error), strerror(error));
  }
  napi_value result;
  if (napi_get_undefined(env, &result) != napi_ok) return NULL;
  return result;
}

static napi_value initialize(napi_env env, napi_value exports) {
  napi_property_descriptor property = {"renameNoReplace", NULL, rename_no_replace, NULL, NULL, NULL, napi_default, NULL};
  if (napi_define_properties(env, exports, 1, &property) != napi_ok)
    return reject(env, "R09_NATIVE_API", "cannot register atomic rename prototype");
  return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, initialize)
