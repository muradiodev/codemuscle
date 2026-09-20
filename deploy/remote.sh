#!/bin/bash
set -euo pipefail
APP="${APP_DIR:-/var/www/html/devpractise2hands}"
SRC=/tmp/codemuscle-src.tar.gz
API_IMAGE="${API_IMAGE:-registry.hubpoint.ai/codemuscle/api:dev-latest}"
WEB_IMAGE="${WEB_IMAGE:-registry.hubpoint.ai/codemuscle/web:dev-latest}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://apicodemuscle.deviofy.com/api/v1}"

echo "===== START $(date -Is) ====="
hostname
whoami

if [ ! -f "$SRC" ]; then
  echo "missing source archive $SRC"
  exit 1
fi
if [ ! -d "$APP" ]; then
  echo "missing app dir $APP"
  exit 1
fi

echo "===== snapshot other services ====="
docker ps --format '{{.Names}} {{.Status}}' | sort > /tmp/cm-ps-before.txt
docker compose ls > /tmp/cm-compose-before.txt
cat /tmp/cm-compose-before.txt

echo "===== backup env ====="
cp -a "$APP/.env.deploy" /tmp/codemuscle.env.deploy.bak
chmod 600 /tmp/codemuscle.env.deploy.bak

echo "===== extract source into CodeMuscle dir only ====="
tar -xzf "$SRC" -C "$APP"
cp -a /tmp/codemuscle.env.deploy.bak "$APP/.env.deploy"
chmod 600 "$APP/.env.deploy"
test -f "$APP/.env.deploy"

cd "$APP"

echo "===== build api ====="
docker build -f infrastructure/api.Dockerfile -t "$API_IMAGE" .

echo "===== build web ====="
docker build -f infrastructure/web.Dockerfile \
  --build-arg "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" \
  -t "$WEB_IMAGE" .

echo "===== push images ====="
docker push "$API_IMAGE"
docker push "$WEB_IMAGE"

echo "===== recreate only CodeMuscle compose project ====="
docker compose --env-file .env.deploy -f docker-compose.deploy.yml up -d

echo "===== wait for api health ====="
ok=0
for i in $(seq 1 40); do
  if curl -fsS http://127.0.0.1:4010/api/v1/health >/dev/null; then
    echo "api healthy after ${i} attempts"
    ok=1
    break
  fi
  sleep 3
done
if [ "$ok" -ne 1 ]; then
  echo "api did not become healthy"
  docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
  docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=80
  exit 1
fi

echo "===== migrate ====="
docker exec -w /app/apps/api devpractise2hands-api-1 npx prisma migrate deploy

echo "===== seed catalog ====="
docker exec -w /app/apps/api devpractise2hands-api-1 npx tsx prisma/seed.ts

echo "===== local checks ====="
curl -fsS http://127.0.0.1:4010/api/v1/health
echo
curl -sS -o /dev/null -w "web_local %{http_code}\n" http://127.0.0.1:3010/

echo "===== snapshot after ====="
docker ps --format '{{.Names}} {{.Status}}' | sort > /tmp/cm-ps-after.txt
python3 - <<'PY'
from pathlib import Path
before = {line.split()[0] for line in Path("/tmp/cm-ps-before.txt").read_text().splitlines() if line.strip()}
after = {line.split()[0] for line in Path("/tmp/cm-ps-after.txt").read_text().splitlines() if line.strip()}
print("removed", sorted(before - after))
print("added", sorted(after - before))
print("codemuscle still present", "devpractise2hands-api-1" in after and "devpractise2hands-web-1" in after)
PY

echo "===== DONE $(date -Is) ====="
