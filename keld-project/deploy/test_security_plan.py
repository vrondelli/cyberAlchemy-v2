from pathlib import Path
import json
import re
import subprocess
import tempfile
import unittest


HERE=Path(__file__).resolve().parent
KEYCLOAK='quay.io/keycloak/keycloak:26.7.4@sha256:82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c'


class SecurityPlanTests(unittest.TestCase):
    def test_are_uses_a_separate_canonical_domain(self):
        caddy=(HERE/'Caddyfile').read_text()
        storefront=caddy[:caddy.index('{$AUTH_DOMAIN}')]
        are=caddy[caddy.index('{$ARE_DOMAIN}'):]
        self.assertNotIn('@are path',storefront)
        self.assertIn('@legacyPage path /are /are/',are)
        self.assertIn('redir @legacyPage / 308',are)
        self.assertIn('rewrite * /are/',are)
        staging=(HERE/'Caddyfile.staging-candidate').read_text()
        self.assertIn('{$ARE_DOMAIN} {',staging)
        compose=(HERE/'compose.yaml').read_text()
        self.assertIn('ARE_DOMAIN: ${ARE_DOMAIN:?set ARE_DOMAIN}',compose)
        self.assertIn('ARE_CHAT_PUBLIC_HOST: "${ARE_DOMAIN:?set ARE_DOMAIN}"',compose)
        self.assertIn('ARE_CHAT_PUBLIC_ORIGIN: "https://${ARE_DOMAIN:?set ARE_DOMAIN}"',compose)
        self.assertNotIn('ARE_CHAT_PUBLIC_HOST: "${KELD_DOMAIN:',compose)
        self.assertNotIn('ARE_CHAT_PUBLIC_ORIGIN: "https://${KELD_DOMAIN:',compose)

    def test_every_edge_sets_host_only_hsts_and_strips_keycloak_policy(self):
        for name in ('Caddyfile','Caddyfile.staging-candidate','Caddyfile.infrastructure'):
            source=(HERE/name).read_text()
            self.assertGreaterEqual(source.count('Strict-Transport-Security "max-age=86400"'),2,name)
            self.assertIn('header_down -Strict-Transport-Security',source,name)
            self.assertNotIn('includeSubDomains',source,name)
            self.assertIn('@clientRegistration path /realms/keld/clients-registrations /realms/keld/clients-registrations/*',source,name)
            self.assertLess(source.index('handle @clientRegistration'),source.index('handle @public'),name)
            self.assertIn('header_up -X-Forwarded-Client-Cert',source,name)
            self.assertIn('header_up -SSL-Client-Cert',source,name)
            self.assertIn('header_up -SSL-Cert-Chain',source,name)

    def test_every_edge_uses_the_non_root_read_only_candidate(self):
        dockerfile=(HERE/'Caddy.Dockerfile').read_text()
        self.assertIn('COPY Caddy.go.mod ./go.mod',dockerfile)
        self.assertIn('COPY Caddy.go.sum ./go.sum',dockerfile)
        self.assertIn('go mod verify',dockerfile)
        self.assertIn('go build -mod=readonly',dockerfile)
        self.assertNotIn('go get ',dockerfile)
        self.assertTrue((HERE/'Caddy.go.mod').is_file())
        self.assertTrue((HERE/'Caddy.go.sum').is_file())
        for name in ('compose.yaml','compose.staging-candidate.yaml','compose.infrastructure.yaml'):
            source=(HERE/name).read_text()
            block=source[source.index('  edge:'):source.index('  postgres:')]
            self.assertIn('image: keld-caddy:',block,name)
            self.assertIn('build: {context: ., dockerfile: Caddy.Dockerfile}',block,name)
            self.assertIn('user: "1001:1001"',block,name)
            self.assertIn('read_only: true',block,name)
            self.assertIn('cap_drop: [ALL]',block,name)
            self.assertIn('cap_add: [NET_BIND_SERVICE]',block,name)
            self.assertIn('security_opt: [no-new-privileges:true]',block,name)
            self.assertIn('pids_limit: 128',block,name)
            self.assertIn('mem_limit: 256m',block,name)

    def test_caddy_storage_migration_is_narrow_and_verified(self):
        script=HERE/'migrate-caddy-storage.sh'
        subprocess.run(['bash','-n',script],check=True)
        source=script.read_text()
        self.assertIn('/var/lib/docker/volumes/*/_data',source)
        self.assertIn('-xdev -type l',source)
        self.assertIn('chown -h 1001:1001',source)
        self.assertIn('! -uid 1001 -o ! -gid 1001',source)

    def test_all_keycloak_services_are_pinned_and_healthy(self):
        entrypoint=(HERE/'keycloak-entrypoint.sh').read_text()
        self.assertIn('start --import-realm',entrypoint)
        self.assertNotIn('start --optimized',entrypoint)
        for name in ('compose.yaml','compose.staging-candidate.yaml','compose.infrastructure.yaml'):
            source=(HERE/name).read_text()
            self.assertIn('image: '+KEYCLOAK,source,name)
            block=source[source.index('  keycloak:'):]
            self.assertRegex(block,r'healthcheck:\n\s+test:.*health/ready',name)
            self.assertIn('user: "1000:0"',block,name)
            self.assertIn('cap_drop: [ALL]',block,name)
            self.assertIn('security_opt: [no-new-privileges:true]',block,name)
            self.assertIn('pids_limit: 256',block,name)
            self.assertIn('tmpfs: ["/tmp:size=64m,mode=1777"]',block,name)
        for name in ('compose.yaml','compose.staging-candidate.yaml'):
            source=(HERE/name).read_text()
            self.assertIn('keycloak: {condition: service_healthy}',source,name)
            worker=source[source.index('  worker:'):]
            self.assertRegex(worker,r'healthcheck:\n\s+test:.*worker-health\.json',name)

    def test_experimental_keycloak_overlays_complete_pinned_bc_set(self):
        source=(HERE/'Keycloak.Dockerfile').read_text()
        self.assertEqual(source.count('ADD --checksum=sha256:'),3)
        self.assertIn('bcprov-jdk18on/1.85/bcprov-jdk18on-1.85.jar',source)
        self.assertIn('bcpkix-jdk18on/1.85/bcpkix-jdk18on-1.85.jar',source)
        self.assertIn('bcutil-jdk18on/1.85/bcutil-jdk18on-1.85.jar',source)
        self.assertIn('/opt/keycloak/bin/client/lib/bcprov-jdk18on-1.84.jar',source)
        self.assertIn('/opt/keycloak/lib/lib/main/org.bouncycastle.bcprov-jdk18on-1.84.jar',source)
        self.assertIn('/opt/keycloak/lib/lib/main/org.bouncycastle.bcpkix-jdk18on-1.84.jar',source)
        self.assertIn('/opt/keycloak/lib/lib/main/org.bouncycastle.bcutil-jdk18on-1.84.jar',source)
        self.assertEqual(source.count('bcprov-jdk18on-1.85.jar'),5)
        self.assertIn(
            '/opt/keycloak/lib/lib/main/org.bouncycastle.bcprov-jdk18on-1.84.jar',
            source,
        )
        final_stage=source.rsplit(
            'FROM quay.io/keycloak/keycloak:26.7.4@sha256:',
            maxsplit=1,
        )[1]
        self.assertIn('USER 0',final_stage)
        self.assertIn('RUN rm -rf /opt/keycloak',final_stage)
        self.assertLess(
            final_stage.index('RUN rm -rf /opt/keycloak'),
            final_stage.index('COPY --from=builder'),
        )
        self.assertNotIn('curl ',source)
        self.assertNotIn('wget ',source)

    def test_keycloak_candidate_rehearsal_is_isolated_and_disposable(self):
        script=HERE/'rehearse-keycloak-candidate.sh'
        subprocess.run(['bash','-n',script],check=True)
        source=script.read_text()
        self.assertIn('docker network create --internal',source)
        self.assertIn('--read-only --cap-drop ALL',source)
        self.assertIn('--security-opt no-new-privileges:true',source)
        self.assertIn('start --optimized',source)
        self.assertIn('/health/ready',source)
        self.assertIn('/realms/keld/.well-known/openid-configuration',source)
        self.assertIn("'SELECT count(*) FROM user_entity'",source)
        self.assertIn("'SELECT count(*) FROM realm'",source)
        self.assertIn('rehearsal_dump_volume',source)
        self.assertIn('chmod 0400 /backup/keycloak.dump',source)
        self.assertIn('KELD_REHEARSAL_HOLD_SECONDS',source)
        self.assertIn('KELD_REHEARSAL_BROWSER_PORT',source)
        self.assertIn('browser-target=',source)
        self.assertNotIn('-p ',source)
        self.assertNotIn('--publish',source)
        self.assertIn('trap cleanup EXIT',source)

    def test_keycloak_candidate_app_rehearsal_preserves_https_and_isolation(self):
        script=HERE/'rehearse-keycloak-app-candidate.sh'
        subprocess.run(['bash','-n',script],check=True)
        source=script.read_text()
        self.assertIn('docker network create --internal',source)
        self.assertIn('https://auth.rehearsal.test:18443',source)
        self.assertIn('https://app.rehearsal.test:18443',source)
        self.assertIn('reverse_proxy keycloak:8080',source)
        self.assertIn('reverse_proxy app:8080',source)
        self.assertIn('-e KC_HTTP_ENABLED=true',source)
        self.assertIn('-e KC_PROXY_HEADERS=xforwarded',source)
        self.assertIn('TRUNCATE af_login_transactions, af_session_handles, af_session_families',source)
        self.assertIn('buyerBCrossRestoreStatus',source)
        self.assertIn('maxSessionGeneration',source)
        self.assertNotIn('--publish',source)
        self.assertNotIn('-p ',source)
        self.assertIn('trap cleanup EXIT',source)

    def test_keycloak_candidate_vex_is_exact_unapproved_and_non_operational(self):
        verifier=HERE/'verify-keycloak-bc185-candidate-vex-proposal.mjs'
        result=subprocess.run(
            ['node',verifier],
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertIn('"status":"unapproved-proposal"',result.stdout)
        self.assertIn('"CVE-2026-75595":"not_affected"',result.stdout)
        self.assertIn('"CVE-2025-59250":"not_affected"',result.stdout)
        self.assertIn('"CVE-2026-22020":"under_investigation"',result.stdout)
        self.assertIn('"composePromotion":false',result.stdout)
        self.assertIn('"operationalConsumption":false',result.stdout)

    def test_are_source_capture_never_starts_images_or_reads_runtime_secrets(self):
        script=(HERE/'capture_are_source_provenance.py').read_text()
        self.assertIn('"create", image',script)
        self.assertIn('"cp", f"{container}:/srv/."',script)
        self.assertIn('"rm", "-f", container',script)
        self.assertNotIn('"run", image',script)
        self.assertNotIn('/run/secrets',script)
        self.assertIn('exact-image-id-required',script)
        self.assertIn('are-observed-image-tree/v1',script)
        self.assertIn('declaredTreeMatchesObserved',script)
        self.assertIn('"differences": {"missing": missing, "extra": extra, "changed": changed}',script)

    def test_custom_image_archive_requires_exact_ids_and_verifies_oci_blobs(self):
        script=(HERE/'capture_custom_image_archive.py').read_text()
        self.assertIn('invalid-exact-image',script)
        self.assertIn('archive-blob-digest-mismatch',script)
        self.assertIn('"image", "save", "--output"',script)
        self.assertNotIn('/run/secrets',script)
        self.assertNotIn('docker compose',script)

    def test_custom_image_recovery_requires_empty_containerd_snapshotter_engine(self):
        script=(HERE/'verify_custom_image_archive_recovery.py').read_text()
        self.assertIn('containerd-snapshotter-required-for-exact-id-recovery',script)
        self.assertIn('empty-engine-required',script)
        self.assertIn('recovered-image-set-mismatch',script)
        self.assertIn('recovery-created-containers',script)
        self.assertNotIn('/run/secrets',script)
        self.assertNotIn('docker compose',script)

    def test_keycloak_license_comparator_binds_exact_images_and_fails_on_delta(self):
        script=HERE/'compare-keycloak-license-reports.py'
        subprocess.run(['python3','-m','py_compile',script],check=True)
        def report(image_id,license_name='Apache-2.0'):
            return {
                'Trivy':{'Version':'0.74.0'},
                'ArtifactType':'container_image',
                'CreatedAt':'2026-09-20T12:42:00Z',
                'Metadata':{'ImageID':image_id},
                'Results':[
                    {'Target':'OS Packages','Licenses':[{
                        'PkgName':'fixture','Name':license_name,'Category':'notice',
                        'FilePath':'','Confidence':1,
                    }]},
                    {'Target':'Loose File License(s)','Licenses':[{
                        'PkgName':'','Name':'Apache-2.0','Category':'notice',
                        'FilePath':'opt/keycloak/LICENSE.txt','Confidence':1,
                    }]},
                ],
            }
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            stock=root/'stock.json'
            candidate=root/'candidate.json'
            stock.write_text(json.dumps(report(
                'sha256:82a77884f3af238beab1e7afd63b5f530e1b5c0590bd7aa60b40a40463e29b2c'
            )))
            candidate.write_text(json.dumps(report(
                'sha256:603f818e915dfe80145608dfc22468fcc10b4751744b2bb79f63f42c427a927f'
            )))
            same=subprocess.run(
                ['python3',script,stock,candidate],check=True,capture_output=True,text=True,
            )
            self.assertTrue(json.loads(same.stdout)['ok'])
            candidate.write_text(json.dumps(report(
                'sha256:603f818e915dfe80145608dfc22468fcc10b4751744b2bb79f63f42c427a927f',
                'GPL-3.0-only',
            )))
            changed=subprocess.run(
                ['python3',script,stock,candidate],capture_output=True,text=True,
            )
            self.assertEqual(changed.returncode,1)
            self.assertFalse(json.loads(changed.stdout)['ok'])

    def test_all_postgres_services_use_the_non_root_read_only_candidate(self):
        dockerfile=(HERE/'Postgres.Dockerfile').read_text()
        self.assertIn('FROM postgres:16-alpine@sha256:',dockerfile)
        self.assertIn('USER 70:70',dockerfile)
        self.assertNotIn('golang:',dockerfile)
        self.assertIn('rm -f /usr/local/bin/gosu',dockerfile)
        for name in ('compose.yaml','compose.staging-candidate.yaml','compose.infrastructure.yaml'):
            source=(HERE/name).read_text()
            block=source[source.index('  postgres:'):source.index('  keycloak:')]
            self.assertIn('image: keld-postgres:',block,name)
            self.assertIn('user: "70:70"',block,name)
            self.assertIn('read_only: true',block,name)
            self.assertIn('cap_drop: [ALL]',block,name)
            self.assertIn('security_opt: [no-new-privileges:true]',block,name)
            self.assertIn('/var/run/postgresql:size=16m,uid=70,gid=70,mode=3775',block,name)

    def test_canonical_application_image_is_pinned_alpine_and_non_root(self):
        dockerfile=(HERE/'Dockerfile').read_text()
        self.assertIn(
            'FROM node:26.8.1-alpine@sha256:'
            'ad6400dee476b06e82d0ee3a088e2d7555f6e6569c346e61d69e14d0f19e8c2b',
            dockerfile,
        )
        self.assertIn('apk upgrade --no-cache',dockerfile)
        self.assertIn('apk add --no-cache ca-certificates python3',dockerfile)
        self.assertIn('npm ci --omit=dev --ignore-scripts',dockerfile)
        self.assertIn('rm -rf /usr/local/lib/node_modules/npm',dockerfile)
        self.assertIn('USER 10001:10001',dockerfile)

    def test_live_realm_migration_script_is_syntactically_valid_and_reversible(self):
        for name in ('harden-keycloak-realm.sh','harden-keycloak-crypto-surface.sh'):
            script=HERE/name
            subprocess.run(['bash','-n',script],check=True)
            source=script.read_text()
            self.assertIn('refusing to replace existing rollback state',source,name)
            self.assertIn('rollback state is missing',source,name)
        realm=(HERE/'harden-keycloak-realm.sh').read_text()
        crypto=(HERE/'harden-keycloak-crypto-surface.sh').read_text()
        self.assertIn('bruteForceProtected=true',realm)
        self.assertIn('webauthn-register-passwordless',crypto)
        self.assertIn('external-identity-provider-present',crypto)
        self.assertIn('non-oidc-client-present',crypto)
        self.assertIn('x509-client-authenticator-configured',crypto)
        self.assertIn('authentication-flow-binding-drift',crypto)

    def test_monitor_unit_binds_release_route_and_quote_checks(self):
        service=(HERE/'keld-staging-monitor.service').read_text()
        timer=(HERE/'keld-staging-monitor.timer').read_text()
        self.assertIn('--manifest-tool /opt/keld-staging/capture_release_manifest.py',service)
        self.assertIn('--quote-tool /opt/keld-staging/quote_config.py',service)
        self.assertIn('--quote-config /opt/keld-staging/.runtime/keld.json',service)
        self.assertIn('--expected-are-retention-seconds 1800',service)
        self.assertIn('ProtectSystem=strict',service)
        self.assertIn('NoNewPrivileges=true',service)
        self.assertIn('CapabilityBoundingSet=CAP_DAC_READ_SEARCH',service)
        self.assertIn('AmbientCapabilities=CAP_DAC_READ_SEARCH',service)
        self.assertIn('OnUnitActiveSec=5min',timer)
        self.assertIn('Persistent=true',timer)


if __name__=='__main__':unittest.main()
