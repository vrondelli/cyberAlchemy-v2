FROM gcr.io/distroless/nodejs26-debian13:nonroot@sha256:ea845027bc638317c4b14a8969cc931efc7546ecabb2de1e4dfb2fee835cca2c
WORKDIR /srv
COPY --chown=65532:65532 .runtime/inference-broker-package/ /srv/
COPY --chown=65532:65532 deploy/broker-quota-volume/ /var/lib/are-broker-quota/
USER 65532:65532
ENV NODE_ENV=production ARE_BROKER_HOST=0.0.0.0 ARE_BROKER_PORT=4194
EXPOSE 4194
CMD ["--permission","--allow-fs-read=/srv","--allow-fs-read=/run/secrets/model_api_key","--allow-fs-read=/etc/ssl/certs","--allow-fs-read=/var/lib/are-broker-quota","--allow-fs-write=/var/lib/are-broker-quota","--allow-net","--disable-sigusr1","--disallow-code-generation-from-strings","projects/cyberAlchemy-v2/workspace/experiments/are-documentation/server/broker-server.mjs"]
