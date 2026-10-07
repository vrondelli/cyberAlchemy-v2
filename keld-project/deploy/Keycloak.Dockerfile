# EXPERIMENTAL ONLY. Compose deliberately does not reference this image.
# This overlays the complete Bouncy Castle 1.85 set used by Keycloak rather
# than mixing dependency versions. Do not promote it until its raw scan,
# restored-state rehearsal, browser regression, and security-owner review pass.
FROM quay.io/keycloak/keycloak:26.7.4@sha256:82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c AS builder

USER 0
ADD --checksum=sha256:20af26bf6060bb8005cc2389916812c1e0e998dc48d2ced7131b89461b54cff7 \
    https://repo.maven.apache.org/maven2/org/bouncycastle/bcprov-jdk18on/1.85/bcprov-jdk18on-1.85.jar \
    /tmp/bcprov-jdk18on-1.85.jar
ADD --checksum=sha256:c9f82b2d4e99c4bbdfccf684e52cc06ea06a0b567bfd0d08f9c5a3f417055996 \
    https://repo.maven.apache.org/maven2/org/bouncycastle/bcpkix-jdk18on/1.85/bcpkix-jdk18on-1.85.jar \
    /tmp/bcpkix-jdk18on-1.85.jar
ADD --checksum=sha256:590f55ed5d68529239898a4a5c4f730b6e37f45d1cfa3fbe51f8485abe32c42d \
    https://repo.maven.apache.org/maven2/org/bouncycastle/bcutil-jdk18on/1.85/bcutil-jdk18on-1.85.jar \
    /tmp/bcutil-jdk18on-1.85.jar
RUN rm -f \
      /opt/keycloak/bin/client/lib/bcprov-jdk18on-1.84.jar \
    && install -o 1000 -g 0 -m 0664 /tmp/bcprov-jdk18on-1.85.jar \
      /opt/keycloak/bin/client/lib/bcprov-jdk18on-1.85.jar \
    && install -o 1000 -g 0 -m 0664 /tmp/bcprov-jdk18on-1.85.jar \
      /opt/keycloak/lib/lib/main/org.bouncycastle.bcprov-jdk18on-1.84.jar \
    && install -o 1000 -g 0 -m 0664 /tmp/bcpkix-jdk18on-1.85.jar \
      /opt/keycloak/lib/lib/main/org.bouncycastle.bcpkix-jdk18on-1.84.jar \
    && install -o 1000 -g 0 -m 0664 /tmp/bcutil-jdk18on-1.85.jar \
      /opt/keycloak/lib/lib/main/org.bouncycastle.bcutil-jdk18on-1.84.jar \
    && rm -f /tmp/bc*-jdk18on-1.85.jar

USER 1000:0
ENV KC_DB=postgres KC_HEALTH_ENABLED=true
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.7.4@sha256:82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c
USER 0
RUN rm -rf /opt/keycloak
COPY --from=builder --chown=1000:0 /opt/keycloak/ /opt/keycloak/
USER 1000:0
