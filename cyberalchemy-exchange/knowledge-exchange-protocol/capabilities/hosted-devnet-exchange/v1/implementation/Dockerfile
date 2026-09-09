FROM rust:1.88-bookworm AS build
WORKDIR /build
COPY . .
RUN cargo build --locked --release --bin server

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /build/target/release/server /usr/local/bin/kep-hosted-devnet
USER 65532:65532
ENTRYPOINT ["/usr/local/bin/kep-hosted-devnet"]
