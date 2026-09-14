FROM rust:1.91-bookworm AS build
WORKDIR /src
COPY orchestrator/rwo orchestrator/rwo
COPY orchestrator/runtime orchestrator/runtime
COPY orchestrator/capabilities/orchestration orchestrator/capabilities/orchestration
COPY orchestrator/api orchestrator/api
RUN cargo build --locked --release --manifest-path orchestrator/api/Cargo.toml

FROM debian:bookworm-slim
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /opt/orchestrator/frontend /var/lib/orchestrator \
    && chown -R 65534:65534 /var/lib/orchestrator
COPY --from=build /src/orchestrator/api/target/release/cyberalchemy-orchestrator-api /usr/local/bin/orchestrator-api
COPY orchestrator/frontend/ /opt/orchestrator/frontend/
COPY orchestrator/examples/robot-talks/*.json /opt/orchestrator/examples/robot-talks/
COPY orchestrator/examples/robot-world/*.json /opt/orchestrator/examples/robot-world/
USER 65534:65534
EXPOSE 8787
VOLUME ["/var/lib/orchestrator"]
HEALTHCHECK --interval=30s --timeout=4s --start-period=8s --retries=3 CMD ["curl", "--fail", "--silent", "http://127.0.0.1:8787/healthz"]
ENTRYPOINT ["/usr/local/bin/orchestrator-api"]
CMD ["/var/lib/orchestrator", "/opt/orchestrator/frontend", "0.0.0.0:8787"]
