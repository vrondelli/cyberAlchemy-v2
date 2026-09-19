FROM gcr.io/distroless/nodejs26-debian13:nonroot@sha256:ea845027bc638317c4b14a8969cc931efc7546ecabb2de1e4dfb2fee835cca2c
WORKDIR /srv
COPY --chown=65532:65532 .runtime/provider-gateway-package/ /srv/
USER 65532:65532
ENV NODE_ENV=production ARE_PROVIDER_GATEWAY_HOST=0.0.0.0 ARE_PROVIDER_GATEWAY_PORT=4195
EXPOSE 4195
CMD ["--permission","--allow-fs-read=/srv","--allow-fs-read=/run/secrets/model_api_key","--allow-fs-read=/etc/ssl/certs","--allow-net","--disable-sigusr1","--disallow-code-generation-from-strings","projects/cyberAlchemy-v2/keld-project/are-documentation/server/provider-gateway-server.mjs"]
