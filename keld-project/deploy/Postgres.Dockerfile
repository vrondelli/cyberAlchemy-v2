FROM golang:1.26.6-alpine@sha256:3889b425f035be855a72fb4755265311293b6d414521f0a519d819df32222d83 AS gosu-builder
ENV GOTOOLCHAIN=local CGO_ENABLED=0 GOBIN=/out
RUN go install github.com/tianon/gosu@1.19

FROM postgres:16-alpine@sha256:3c5c8892d184f738f4fe282d14ddaa613a38f00f4189d2d94725ebe6f2909ddb
RUN apk upgrade --no-cache && \
    mkdir -p /var/lib/postgresql/data /var/run/postgresql && \
    chown -R 70:70 /var/lib/postgresql /var/run/postgresql
COPY --from=gosu-builder /out/gosu /usr/local/bin/gosu
USER 70:70
