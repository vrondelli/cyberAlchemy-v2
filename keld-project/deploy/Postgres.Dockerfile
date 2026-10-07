FROM postgres:16-alpine@sha256:cf78e76683b9ca8c5733cbbdce6c9262b45b6767934dd0a95e671f9a0fc20685
RUN apk upgrade --no-cache && \
    rm -f /usr/local/bin/gosu && \
    mkdir -p /var/lib/postgresql/data /var/run/postgresql && \
    chown -R 70:70 /var/lib/postgresql /var/run/postgresql
USER 70:70
