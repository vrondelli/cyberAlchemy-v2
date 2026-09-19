# Account completion theme

The account index template is from Keycloak 26.7.3, Apache-2.0, extracted from org.keycloak.keycloak-account-ui-26.7.3.jar. Upstream template SHA-256: b6e4bb196a333cdbc5ce9bfbdc842e97351fb3b50ebb5630aae4c3085324566e. Only its production entry script tag is changed to call account-entry.js before loading the stock console. The development-server path is not used by this local fixture.

Successful application-initiated action callbacks show a neutral fresh-sign-in screen instead of exchanging an authorization code whose issuer session our credential-change listener revoked. This URL signal is used only to display the next step; it never grants authentication or asserts a change succeeded. Cancellation and ordinary login continue through the unchanged Keycloak console.

## Open Questions

The wrapper/template must be reviewed against each Keycloak upgrade. Production theme packaging is owned by ../../../../development/authentication-v1/MFA-RECOVERY-PLAN.md.

## MFA login button repair

The login successor inherits the frozen auth-foundation theme and Keycloak templates without copying or modifying them. kcButtonDefaultClass selects the native secondary class. Scoped Cancel CSS supplies readable normal, hover and active colors; the inherited keyboard focus outline remains. Submit and Cancel retain native Keycloak submission behavior and server-side OTP validation.

Open questions: see the existing upgrade ownership above and the bounded browser evidence in ../../evidence/mfa-buttons/.
