#!/bin/bash
set -eu
KC_DB_PASSWORD="$(< /run/secrets/keycloak_db_password)"
KC_BOOTSTRAP_ADMIN_PASSWORD="$(< /run/secrets/keycloak_admin_password)"
export KC_DB_PASSWORD KC_BOOTSTRAP_ADMIN_PASSWORD
exec /opt/keycloak/bin/kc.sh start --import-realm
