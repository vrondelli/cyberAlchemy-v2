FROM golang:1.26.6-alpine@sha256:3889b425f035be855a72fb4755265311293b6d414521f0a519d819df32222d83 AS builder
ENV GOTOOLCHAIN=local CGO_ENABLED=0
WORKDIR /build
COPY Caddy.go.mod ./go.mod
COPY Caddy.go.sum ./go.sum
RUN go mod download all && go mod verify && \
    go build -mod=readonly -trimpath -ldflags='-s -w' -o /out/caddy github.com/caddyserver/caddy/v2/cmd/caddy

FROM alpine:3.23.6@sha256:18125326968f1d09ef7b7fff2c06f300767daaf5c6591f735e2f058edfa10a16
RUN apk upgrade --no-cache && apk add --no-cache ca-certificates mailcap && \
    addgroup -S -g 1001 caddy && adduser -S -D -H -u 1001 -G caddy caddy && \
    mkdir -p /data/caddy /config/caddy && chown -R 1001:1001 /data /config
COPY --from=builder /out/caddy /usr/bin/caddy
USER 1001:1001
ENV XDG_CONFIG_HOME=/config XDG_DATA_HOME=/data
EXPOSE 80 443 443/udp
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
