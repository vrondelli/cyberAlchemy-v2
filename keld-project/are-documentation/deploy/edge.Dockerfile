FROM gcr.io/distroless/nodejs26-debian13:nonroot@sha256:ea845027bc638317c4b14a8969cc931efc7546ecabb2de1e4dfb2fee835cca2c
WORKDIR /srv
COPY --chown=65532:65532 server/edge-server.mjs /srv/server/edge-server.mjs
USER 65532:65532
ENV NODE_ENV=production ARE_EDGE_HOST=0.0.0.0 ARE_EDGE_PORT=8080
EXPOSE 8080
CMD ["--permission", "--allow-net", "--disable-sigusr1", "--disallow-code-generation-from-strings", "server/edge-server.mjs"]
