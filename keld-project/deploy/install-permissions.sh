#!/bin/sh
# Run as root on the VPS after copying the private runtime directory.
set -eu
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
chown 1000:0 .runtime/secrets/keycloak_db_password .runtime/secrets/keycloak_admin_password .runtime/keld-realm.json
chmod 400 .runtime/keld-realm.json
if test -f .runtime/keld.json; then chmod 644 .runtime/keld.json; fi

chown 70:70 .runtime/secrets/postgres_admin_password .runtime/init-databases.sql
chmod 400 .runtime/init-databases.sql
