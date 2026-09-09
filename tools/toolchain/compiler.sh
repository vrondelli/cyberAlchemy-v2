#!/bin/sh
# User-owned GCC driver and sysroot. Open questions: README.md.
set -eu
ca2_driver=$(readlink -f -- "$0")
ca2_root=$(CDPATH= cd -- "$(dirname -- "$ca2_driver")/.." && pwd)
case $(basename -- "$0") in
    c++|g++) ca2_compiler=g++ ;;
    cpp) ca2_compiler=cpp ;;
    *) ca2_compiler=gcc ;;
esac
# Compiler helpers need the packaged isl/mpc libraries; do not export this globally.
export LD_LIBRARY_PATH="$ca2_root/sysroot/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
exec "$ca2_root/sysroot/usr/bin/x86_64-linux-gnu-$ca2_compiler-15" \
    "--sysroot=$ca2_root/sysroot" \
    "-B$ca2_root/sysroot/usr/lib/x86_64-linux-gnu/" \
    "-B$ca2_root/sysroot/usr/bin/" "$@"
