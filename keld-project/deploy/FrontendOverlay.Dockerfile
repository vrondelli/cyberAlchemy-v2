ARG KELD_BASE_IMAGE=keld-sandbox:candidate
FROM ${KELD_BASE_IMAGE}

COPY --chown=10001:10001 public-app/ /app/integrations/public-app/
COPY --chown=10001:10001 manifest.json /app/manifest.json
