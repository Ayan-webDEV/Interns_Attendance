# Fix MongoDB Atlas TLS / seed-admin connection errors

The reported error (`ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`, `ReplicaSetNoPrimary`) occurs before the application can use the database. It is a connection/TLS handshake failure, not an admin password or seed-data error. The app cannot fix Atlas network settings from code, so use this checklist in order.

## 1. Verify the URI

In MongoDB Atlas, open **Database → Connect → Drivers** and copy the full Node.js `mongodb+srv://...` URI. Put it in `server/.env` as `MONGODB_URI=...`. Replace the username, password, and database name placeholders. If the password contains characters such as `@`, `:`, `/`, `?`, `#`, or `%`, URL-encode the password. Do not paste the URI into chats or screenshots.

## 2. Allow the current IP

Atlas → **Security → Network Access** → add your current public IP. For a brief local diagnostic only, you can test with `0.0.0.0/0`, but remove it immediately afterwards and use your current IP instead. Do not leave the database open to all IPs in production.

## 3. Check database credentials

Atlas → **Security → Database Access**. Confirm the database user exists and has the required permissions. This is separate from your Atlas website login. Authentication problems normally show an authentication error; they do not usually cause this TLS alert.

## 4. Test whether the network is causing TLS failure

- Check Windows date, time, and timezone are automatic/correct.
- Temporarily disconnect VPN/proxy and check whether antivirus/firewall has HTTPS/TLS inspection enabled.
- Try running `npm run seed-admin` from a phone hotspot. If it works on hotspot but not the usual Wi-Fi, the original network/router/ISP/security software is the likely cause.
- Ensure outbound connections to Atlas MongoDB hosts on TCP port 27017 are allowed.
- From PowerShell, test DNS: `nslookup -type=SRV _mongodb._tcp.<your-cluster-host>`; use the cluster hostname from the URI without `mongodb+srv://` and without the username/password.

## 5. Update dependencies and use a supported Node LTS

In `server`, run `npm install mongoose@^8` then `npm ls mongoose mongodb`, and retry. If the issue persists, test using a current supported Node.js LTS release installed from nodejs.org. Reopen the terminal after changing Node versions. Do not disable TLS, set `tlsAllowInvalidCertificates`, or use an insecure connection string to work around this error.

## 6. Retry the seed

Once the backend can connect to Atlas, run:

```powershell
cd server
npm run seed-admin
```

The seed script should only be run after `MONGODB_URI`, `ADMIN_EMAILS`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` are correctly configured. The seeded email must appear in `ADMIN_EMAILS`.

## What the reported log tells us

The driver discovered the Atlas replica-set hostnames but received `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` during TLS setup for all three nodes. The error is consistent with a network/TLS issue or a cluster/connection configuration issue. The log alone cannot prove that IP allowlisting is the cause. If the steps above fail, copy the Atlas URI format with credentials redacted and the output of `node -v` and `npm ls mongoose mongodb`; never share passwords or a full connection URI.
