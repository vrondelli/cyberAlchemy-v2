import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


HERE = Path(__file__).resolve().parent


class KeycloakCryptoSurfaceTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / ".runtime").mkdir()
        (self.root / "compose.staging-candidate.yaml").write_text("services: {}\n")
        self.script = self.root / "harden-keycloak-crypto-surface.sh"
        shutil.copy2(HERE / "harden-keycloak-crypto-surface.sh", self.script)
        fake_bin = self.root / "bin"
        fake_bin.mkdir()
        self.state = self.root / "fake-actions"
        self.state.write_text("true true\n")
        docker = fake_bin / "docker"
        docker.write_text("""#!/bin/sh
set -eu
args="$*"
read normal passwordless < "$FAKE_ACTION_STATE"
case "$args" in
  *"get authentication/required-actions"*)
    printf '[{"alias":"webauthn-register","name":"Webauthn Register","enabled":%s,"defaultAction":false,"priority":80},{"alias":"webauthn-register-passwordless","name":"Webauthn Register Passwordless","enabled":%s,"defaultAction":false,"priority":90}]\\n' "$normal" "$passwordless" ;;
  *"get identity-provider/instances"*)
    if [ "${FAKE_IDENTITY_PROVIDER:-0}" = 1 ]; then printf '[{"alias":"external","providerId":"oidc","enabled":true}]\\n'; else printf '[]\\n'; fi ;;
  *"get clients"*)
    if [ "${FAKE_X509_CLIENT:-0}" = 1 ]; then auth=client-x509; else auth=client-secret; fi
    printf '[{"clientId":"keld","protocol":"openid-connect","enabled":true,"clientAuthenticatorType":"%s","attributes":{}}]\\n' "$auth" ;;
  *"get realms/keld"*)
    printf '{"browserFlow":"browser","registrationFlow":"registration","directGrantFlow":"direct grant","resetCredentialsFlow":"reset credentials","clientAuthenticationFlow":"clients","dockerAuthenticationFlow":"docker auth","firstBrokerLoginFlow":"first broker login"}\\n' ;;
  *"get authentication/flows/browser/executions"*)
    printf '[{"displayName":"WebAuthn Authenticator","providerId":"webauthn-authenticator","requirement":"DISABLED"}]\\n' ;;
  *"get authentication/flows/direct%20grant/executions"*)
    if [ "${FAKE_X509_FLOW:-0}" = 1 ]; then printf '[{"providerId":"direct-grant-x509-username","requirement":"REQUIRED"}]\\n'; else printf '[]\\n'; fi ;;
  *"get authentication/flows/clients/executions"*)
    printf '[{"displayName":"X509 Certificate","providerId":"client-x509","requirement":"ALTERNATIVE"}]\\n' ;;
  *"get authentication/flows/registration/executions"*|*"get authentication/flows/reset%20credentials/executions"*|*"get authentication/flows/docker%20auth/executions"*|*"get authentication/flows/first%20broker%20login/executions"*)
    printf '[]\\n' ;;
  *"update authentication/required-actions/webauthn-register-passwordless"*)
    value=false; case "$args" in *"enabled=true"*) value=true ;; esac
    printf '%s %s\\n' "$normal" "$value" > "$FAKE_ACTION_STATE" ;;
  *"update authentication/required-actions/webauthn-register"*)
    value=false; case "$args" in *"enabled=true"*) value=true ;; esac
    printf '%s %s\\n' "$value" "$passwordless" > "$FAKE_ACTION_STATE" ;;
  *) printf 'unexpected docker invocation: %s\\n' "$args" >&2; exit 90 ;;
esac
""")
        docker.chmod(0o755)
        self.environment = {
            **os.environ,
            "PATH": f"{fake_bin}:{os.environ['PATH']}",
            "FAKE_ACTION_STATE": str(self.state),
        }

    def tearDown(self):
        self.temporary.cleanup()

    def run_action(self, action, **environment):
        return subprocess.run(
            ["bash", str(self.script), action],
            cwd=self.root,
            env={**self.environment, **environment},
            text=True,
            capture_output=True,
        )

    def test_apply_verify_and_rollback_are_stateful_and_reversible(self):
        initial = self.run_action("verify")
        self.assertNotEqual(initial.returncode, 0)
        self.assertIn("webauthn-required-action-enabled", initial.stderr)

        applied = self.run_action("apply")
        self.assertEqual(applied.returncode, 0, applied.stderr)
        self.assertEqual(self.state.read_text(), "false false\n")
        rollback = self.root / ".runtime" / "keycloak-crypto-surface.before.json"
        self.assertTrue(rollback.is_file())
        self.assertEqual(self.run_action("verify").returncode, 0)

        duplicate = self.run_action("apply")
        self.assertNotEqual(duplicate.returncode, 0)
        self.assertIn("refusing to replace existing rollback state", duplicate.stderr)

        restored = self.run_action("rollback")
        self.assertEqual(restored.returncode, 0, restored.stderr)
        self.assertEqual(self.state.read_text(), "true true\n")
        self.assertFalse(rollback.exists())
        self.assertEqual(len(list((self.root / ".runtime").glob("*.applied.*"))), 1)

    def test_apply_refuses_an_external_identity_provider_before_mutation(self):
        result = self.run_action("apply", FAKE_IDENTITY_PROVIDER="1")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("external-identity-provider-present", result.stderr)
        self.assertEqual(self.state.read_text(), "true true\n")
        self.assertFalse((self.root / ".runtime" / "keycloak-crypto-surface.before.json").exists())

    def test_verify_rejects_x509_client_configuration(self):
        self.state.write_text("false false\n")
        result = self.run_action("verify", FAKE_X509_CLIENT="1")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("x509-client-authenticator-configured", result.stderr)

    def test_verify_rejects_x509_outside_the_guarded_client_flow(self):
        self.state.write_text("false false\n")
        result = self.run_action("verify", FAKE_X509_FLOW="1")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("x509-flow-execution-enabled:direct grant", result.stderr)


if __name__ == "__main__":
    unittest.main()
