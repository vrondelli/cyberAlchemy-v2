#!/usr/bin/env bash
# Test-only: run the AlchLang local-host integration suite with the existing
# Ansible test image and the host's unprivileged bubblewrap namespace support.
set -euo pipefail

package_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd -- "$package_dir/../../.." && pwd -P)"
user_home="$(getent passwd "$(id -u)" | cut -d: -f6)"
image_name='alch-local-host-test:node26'
toolchain_dir="$user_home/.local/share/cyberalchemy/toolchains/ubuntu-26.04-amd64-4664d1766b60"
test_dir="$repo_root/language/capabilities/alchlang/plans/general-compiler-v1/implementation"

if [[ "$user_home" != /home/* || ! -d "$user_home/.rustup" ||
      ! -d "$user_home/.cargo/bin" || ! -d "$user_home/.cargo/registry" ||
      ! -d "$toolchain_dir" || ! -d "$test_dir/node_modules" ]]; then
  echo 'Required local home toolchain or locked package dependencies are missing.' >&2
  exit 2
fi
for command_name in bwrap docker tar mktemp getent; do
  command -v "$command_name" >/dev/null || { echo "Missing $command_name" >&2; exit 2; }
done

# Use the immutable local image ID, not a tag that could be moved between
# inspection and export. The container is created but never started.
image_id="$(docker image inspect "$image_name" --format '{{.Id}}')"
if [[ ! "$image_id" =~ ^sha256:[a-f0-9]{64}$ ]]; then
  echo 'The local test image has no valid immutable image ID.' >&2
  exit 2
fi

private_root="$(mktemp -d /var/tmp/alch-local-host-test.XXXXXXXX)"
container_id=''
cleanup() {
  if [[ -n "$container_id" ]]; then
    docker rm "$container_id" >/dev/null || echo "Could not remove temporary container $container_id" >&2
  fi
  if [[ "$private_root" == /var/tmp/alch-local-host-test.* && -d "$private_root" ]]; then
    rm -rf -- "$private_root" || echo "Could not remove temporary root $private_root" >&2
  fi
}
trap cleanup EXIT
mkdir -m 0700 "$private_root/rootfs" "$private_root/work"

container_id="$(docker create --network none "$image_id" /usr/bin/true)"
docker export "$container_id" | tar --no-same-owner --no-same-permissions -xf - -C "$private_root/rootfs"
docker rm "$container_id" >/dev/null
container_id=''

echo "Test image: $image_id"
echo 'Running local-host integration tests in an unprivileged, network-unshared host namespace.'
exec_status=0
bwrap --unshare-all --new-session --die-with-parent \
  --ro-bind "$private_root/rootfs" / --proc /proc --dev /dev \
  --tmpfs /tmp --bind "$private_root/work" /var/tmp --tmpfs /home \
  --dir "$user_home/projects" --ro-bind "$repo_root" "$repo_root" \
  --dir "$user_home/.rustup" --ro-bind "$user_home/.rustup" "$user_home/.rustup" \
  --ro-bind "$user_home/.cargo/bin" /var/tmp/bin \
  --ro-bind "$user_home/.cargo/registry" /var/tmp/registry \
  --dir "$user_home/.local/share/cyberalchemy/toolchains" \
  --ro-bind "$toolchain_dir" "$toolchain_dir" \
  --clearenv --setenv HOME "$user_home" \
  --setenv XDG_DATA_HOME "$user_home/.local/share" \
  --setenv CARGO_HOME /var/tmp --setenv RUSTUP_HOME "$user_home/.rustup" \
  --setenv TMPDIR /var/tmp --setenv PYTHONDONTWRITEBYTECODE 1 \
  --setenv ANSIBLE_LOCAL_TEMP /var/tmp/ansible-tmp --setenv AR /usr/bin/ar \
  --setenv PATH /usr/local/bin:/usr/bin:/bin:/var/tmp/bin \
  --chdir "$test_dir" \
  node scripts/run-toolchain.mjs tsx --test --test-concurrency=1 \
    test/local-host.test.ts test/local-host-events.test.ts || exec_status=$?
exit "$exec_status"
