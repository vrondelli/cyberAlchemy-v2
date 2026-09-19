package auth.foundation;

import java.util.List;
import org.keycloak.Config;
import org.keycloak.authentication.*;
import org.keycloak.models.*;
import org.keycloak.provider.ProviderConfigProperty;

/** Policy composition only. Keycloak's built-in required action validates enrollment. */
public final class MfaEnrollment implements Authenticator, AuthenticatorFactory {
    public static final String ID = "auth-foundation-mfa-enrollment";
    public void authenticate(AuthenticationFlowContext context) {
        UserModel user = context.getUser();
        RoleModel role = context.getRealm().getRole("auth-privileged");
        if (role == null) { context.failure(AuthenticationFlowError.INTERNAL_ERROR); return; }
        if (user.hasRole(role) && !user.credentialManager().isConfiguredFor("otp")
                && !user.credentialManager().isConfiguredFor("webauthn-passwordless")
                && !user.credentialManager().isConfiguredFor("recovery-authn-codes")) {
            context.getAuthenticationSession().addRequiredAction(UserModel.RequiredAction.CONFIGURE_TOTP);
        }
        if (user.hasRole(role) && !user.credentialManager().isConfiguredFor("recovery-authn-codes")) {
            context.getAuthenticationSession().addRequiredAction(UserModel.RequiredAction.CONFIGURE_RECOVERY_AUTHN_CODES);
        }
        context.success();
    }
    public void action(AuthenticationFlowContext context) { context.failure(AuthenticationFlowError.INTERNAL_ERROR); }
    public boolean requiresUser() { return true; }
    public boolean configuredFor(KeycloakSession s, RealmModel r, UserModel u) { return true; }
    public void setRequiredActions(KeycloakSession s, RealmModel r, UserModel u) { }
    public Authenticator create(KeycloakSession s) { return this; }
    public String getId() { return ID; }
    public String getDisplayType() { return "Auth Foundation privileged MFA enrollment"; }
    public String getHelpText() { return "Requires built-in OTP enrollment for privileged identities without a second factor."; }
    public String getReferenceCategory() { return "mfa-policy"; }
    public boolean isConfigurable() { return false; }
    public boolean isUserSetupAllowed() { return false; }
    public AuthenticationExecutionModel.Requirement[] getRequirementChoices() { return new AuthenticationExecutionModel.Requirement[]{AuthenticationExecutionModel.Requirement.REQUIRED}; }
    public List<ProviderConfigProperty> getConfigProperties() { return List.of(); }
    public void init(Config.Scope c) { }
    public void postInit(KeycloakSessionFactory f) { }
    public void close() { }
}
