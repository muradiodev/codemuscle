# CodeMuscle live deploy

The public site runs on **DEVHUBPOINT01**, not PRODHUBPOINT01.

| Item | Value |
|---|---|
| Web | https://codemuscle.deviofy.com |
| API | https://apicodemuscle.deviofy.com |
| Server dir | `/var/www/html/devpractise2hands` |
| Compose | `docker-compose.deploy.yml` + gitignored `.env.deploy` |
| Images | `registry.hubpoint.ai/codemuscle/{web,api}:dev-latest` |

DEV port 22 is often closed from operator networks. The script jumps through **MGMTHUBPOINT01**.

## One-time secrets

Files in `deploy/secrets/` are gitignored.

1. Copy `dev_key`, `prod_key`, and `mgmt_key` from `%USERPROFILE%\.ssh_hubpoint\`.
2. Copy `deploy/env.example` to `deploy/secrets/.env` and fill registry + database values.
3. Optional: copy the server file `/var/www/html/devpractise2hands/.env.deploy` to `deploy/secrets/env.deploy`.

Never commit keys, `.env`, `.env.deploy`, or `Hubpoint_Infrastructure_CICD_Server_Operations_Runbook.md`.

## Deploy the live site

From the repo root (Windows):

```powershell
.\deploy\Deploy-CodeMuscle.ps1
```

or:

```bash
npm run deploy:live
```

The script:

1. Packs the repo (excluding secrets, `node_modules`, env files).
2. Uploads only to `/var/www/html/devpractise2hands`.
3. Builds and pushes CodeMuscle images.
4. Recreates **only** the `devpractise2hands` Compose project.
5. Runs Prisma migrate + seed.
6. Checks API health.

It does **not** reload nginx, change TLS, or restart other Hubpoint apps.

## Do not do

- Do not deploy CodeMuscle onto PRODHUBPOINT01 unless that is explicitly requested. Other products live there.
- Do not overwrite `/etc/nginx/conf.d/codemuscle.deviofy.com.conf` (Certbot TLS). The file in `infrastructure/` is a reference only.
- Do not run `docker compose` without `-f docker-compose.deploy.yml` on the server.
