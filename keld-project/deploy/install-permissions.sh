#!/bin/sh
# Run as root on the VPS after copying the private runtime directory.
set -eu
mode=full
case "$#" in
  0) ;;
  1) test "$1" = --infrastructure-only; mode=infrastructure ;;
  *) exit 64 ;;
esac
test "$(id -u)" = 0
cd "$(dirname "$0")"
test -d .runtime/secrets
test ! -L .runtime
test ! -L .runtime/secrets
test -z "$(find .runtime -type l -print -quit)"
chown -R 10001:10001 .runtime/commerce
chown -R 70:70 .runtime/postgres
chmod 700 .runtime .runtime/secrets .runtime/commerce .runtime/postgres
chown 10001:10001 .runtime/secrets/*
chmod 400 .runtime/secrets/*
if test "$mode" = full; then
  test -f .runtime/secrets/are_model_api_key
  chown 65532:65532 .runtime/secrets/are_model_api_key
else
  test ! -e .runtime/secrets/are_model_api_key
fi
chown 1000:0 .runtime/secrets/keycloak_db_password .runtime/secrets/keycloak_admin_password .runtime/keld-realm.json
chmod 400 .runtime/keld-realm.json
if test -f .runtime/keld.json; then chmod 644 .runtime/keld.json; fi

chown 70:70 .runtime/secrets/postgres_admin_password .runtime/init-databases.sql
chmod 400 .runtime/init-databases.sql
