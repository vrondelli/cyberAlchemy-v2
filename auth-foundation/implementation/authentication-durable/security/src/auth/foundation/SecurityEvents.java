package auth.foundation;

import java.util.Objects;
import org.keycloak.models.utils.KeycloakModelUtils;
import org.keycloak.Config;
import org.keycloak.common.util.Time;
import org.keycloak.events.*;
import org.keycloak.events.admin.AdminEvent;
import org.keycloak.models.*;

/** No credential values are read or logged. Invalidation uses the issuer session store. */
public final class SecurityEvents implements EventListenerProviderFactory {
    public static final String ID = "auth-foundation-security-events";
    public EventListenerProvider create(KeycloakSession session) {
        return new EventListenerProvider() {
            private void revoke(String realmId, String userId, String keep) {
                RealmModel realm = session.realms().getRealm(realmId);
                if (realm == null || !"auth-https".equals(realm.getName()) || userId == null) return;
                UserModel user = session.users().getUserById(realm, userId);
                if (user == null) return;
                var online = session.sessions().getUserSessionsStream(realm, user)
                    .filter(s -> !Objects.equals(s.getId(), keep)).map(UserSessionModel::getId).toList();
                var offline = session.sessions().getOfflineUserSessionsStream(realm, user)
                    .map(UserSessionModel::getId).toList();
                if (online.isEmpty() && offline.isEmpty()) return;
                // An issuer token fence commits with the credential change, independently of cleanup.
                if (keep == null) session.users().setNotBeforeForUser(realm, user,
                    Math.max(session.users().getNotBeforeOfUser(realm, user), Time.currentTime() + 1));
                var factory = session.getKeycloakSessionFactory();
                // Never delete a session in the transaction which is still updating it.
                // Capture pre-change sessions; required-action completion may create a new one.
                session.getTransactionManager().enlistAfterCompletion(new AbstractKeycloakTransaction() {
                    protected void commitImpl() {
                        KeycloakModelUtils.runJobInTransaction(factory, fresh -> {
                            RealmModel target = fresh.realms().getRealm(realmId);
                            if (target == null) return;
                            fresh.getContext().setRealm(target);
                            for (String id : online) {
                                UserSessionModel current = fresh.sessions().getUserSession(target, id);
                                if (current != null) fresh.sessions().removeUserSession(target, current);
                            }
                            for (String id : offline) {
                                UserSessionModel current = fresh.sessions().getOfflineUserSession(target, id);
                                if (current != null) fresh.sessions().removeOfflineUserSession(target, current);
                            }
                        });
                    }
                    protected void rollbackImpl() { }
                });
            }
            public void onEvent(Event event) {
                String type = event.getType().name();
                if (event.getError() != null) return;
                if (type.equals("UPDATE_CREDENTIAL") || type.equals("REMOVE_CREDENTIAL")) {
                    revoke(event.getRealmId(), event.getUserId(), null);
                } else if (type.equals("LOGIN") && event.getDetails() != null
                        && "recovery-authn-codes".equals(event.getDetails().get(Details.CREDENTIAL_TYPE))) {
                    revoke(event.getRealmId(), event.getUserId(), event.getSessionId());
                }
            }
            public void onEvent(AdminEvent event, boolean includeRepresentation) {
                if (event.getError() != null || event.getResourcePath() == null) return;
                String[] path = event.getResourcePath().split("/");
                if (path.length >= 3 && path[0].equals("users")
                        && (path[2].equals("reset-password") || path[2].equals("credentials") || path[2].equals("role-mappings") || path[2].equals("groups"))) {
                    revoke(event.getRealmId(), path[1], null);
                } else if (path.length == 2 && path[0].equals("users")) {
                    RealmModel realm = session.realms().getRealm(event.getRealmId());
                    if (realm == null || !"auth-https".equals(realm.getName())) return;
                    UserModel user = session.users().getUserById(realm, path[1]);
                    if (user != null && !user.isEnabled()) revoke(event.getRealmId(), path[1], null);
                } else if (path[0].equals("groups") || path[0].equals("roles") || path[0].equals("roles-by-id")
                        || (path.length >= 3 && path[0].equals("clients") && path[2].equals("roles"))) {
                    RealmModel realm = session.realms().getRealm(event.getRealmId());
                    if (realm == null || !"auth-https".equals(realm.getName())) return;
                    // Graph edits can affect descendants and composites, including deleted edges.
                    // Conservative realm-wide invalidation avoids guessing the former membership.
                    session.users().searchForUserStream(realm, java.util.Map.of()).map(UserModel::getId)
                        .toList().forEach(id -> revoke(event.getRealmId(), id, null));
                }
            }
            public void close() { }
        };
    }
    public String getId() { return ID; }
    public void init(Config.Scope c) { }
    public void postInit(KeycloakSessionFactory f) { }
    public void close() { }
}
