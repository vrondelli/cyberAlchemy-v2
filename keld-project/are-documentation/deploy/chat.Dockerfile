FROM gcr.io/distroless/nodejs26-debian13:nonroot@sha256:ea845027bc638317c4b14a8969cc931efc7546ecabb2de1e4dfb2fee835cca2c
WORKDIR /srv
COPY --chown=65532:65532 .runtime/public-chat-package/ /srv/
USER 65532:65532
ENV NODE_ENV=production ARE_CHAT_HOST=0.0.0.0 ARE_CHAT_PORT=4193 ARE_INFERENCE_BROKER_ENDPOINT=http://inference-broker:4194/v1/generate
EXPOSE 4193
CMD ["--permission","--allow-fs-read=/srv","--allow-net","--disable-sigusr1","--disallow-code-generation-from-strings","projects/cyberAlchemy-v2/keld-project/are-documentation/server/chat-server.mjs"]
