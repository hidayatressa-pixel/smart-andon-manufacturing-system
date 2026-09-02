# Security Model

## Demo vs cloud mode

`VITE_DATA_PROVIDER=demo` is an offline evaluation mode. Demo data and the demo PIN are local to the browser and must never be used as production credentials.

`VITE_DATA_PROVIDER=firebase` is cloud mode. In this mode:
- Firebase Authentication is the only login authority.
- User roles come from `master_operators/{firebaseAuthUid}` and are enforced by Firestore Security Rules.
- There is no local PIN bypass, automatic account creation, or fallback administrator.
- Failed cloud writes fail closed; they are not silently persisted as authoritative local data.

## Provisioning

Create production users in Firebase Authentication first. Create the matching `master_operators` document using the Firebase Authentication UID as the document ID. Assign the minimum required role and line access. Do not store PINs or passwords in Firestore.

## Secrets

Firebase web configuration identifies a Firebase project and is supplied by the buyer through environment variables. Authorization is enforced by Authentication and Firestore Rules.

Telegram bot credentials are server-only (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`). Never prefix secrets with `VITE_`, because Vite exposes `VITE_*` values to browser bundles.

## Audit trail

`activity_logs` is append-only in cloud mode. Firestore rules deny update and delete operations even to administrators.

## Deployment checklist

1. Set `VITE_DATA_PROVIDER=firebase`.
2. Configure Firebase web settings through deployment secrets/environment variables.
3. Deploy `firestore.rules` before allowing users into the system.
4. Provision Firebase Authentication accounts and UID-matched operator profiles.
5. Set Telegram credentials only in the Node/server environment if notifications are used.
6. Use HTTPS in production and restrict Firebase authorized domains to deployed domains.
7. Do not copy demo credentials into production.
