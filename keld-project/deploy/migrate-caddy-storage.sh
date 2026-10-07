#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'usage: %s <apply|verify> <caddy-data-dir> <caddy-config-dir>\n' "$0" >&2
  exit 64
}

[[ $# -eq 3 ]] || usage
mode=$1
shift
[[ $mode == apply || $mode == verify ]] || usage

directories=("$@")
for directory in "${directories[@]}"; do
  [[ $directory == /var/lib/docker/volumes/*/_data &&
     $directory != /var/lib/docker/volumes/_data &&
     -d $directory && ! -L $directory ]] || {
    printf 'refusing invalid Docker volume data directory\n' >&2
    exit 65
  }
  [[ -z $(find "$directory" -xdev -type l -print -quit) ]] || {
    printf 'refusing Caddy storage containing a symbolic link\n' >&2
    exit 65
  }
done

if [[ $mode == apply ]]; then
  for directory in "${directories[@]}"; do
    find "$directory" -xdev -exec chown -h 1001:1001 -- {} +
  done
fi

for directory in "${directories[@]}"; do
  [[ -z $(find "$directory" -xdev \( ! -uid 1001 -o ! -gid 1001 \) -print -quit) ]] || {
    printf 'Caddy storage ownership verification failed\n' >&2
    exit 1
  }
done

printf '{"ok":true,"mode":"%s","uid":1001,"gid":1001,"volumes":2}\n' "$mode"
