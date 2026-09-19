FROM python:3.12.14-slim-bookworm AS python_runtime
FROM docker:28.0.1-cli@sha256:043c259759666d273afa94a9c9175a87a11f16cde2f613f4c527e4395b703a1f AS docker_cli
FROM domainspec-node-toolchain:26.8.1-ts7.0.2
USER root
RUN apt-get update && apt-get install -y --no-install-recommends git postgresql-client curl ca-certificates libatomic1 libgmp10 && rm -rf /var/lib/apt/lists/*
COPY --from=python_runtime /usr/local/ /usr/local/
COPY --from=docker_cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker_cli /usr/local/libexec/docker/cli-plugins/ /usr/local/libexec/docker/cli-plugins/
COPY requirements-ci.txt /opt/o00/requirements-ci.txt
RUN python3 -m pip install --disable-pip-version-check --no-cache-dir --require-hashes --only-binary=:all: -r /opt/o00/requirements-ci.txt
