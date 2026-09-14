#!/usr/bin/env bash
# Déploie la vitrine Ossatura (site statique + formulaire PHP).
# Pas de build front tant qu'il n'y a pas de package.json ;
# si un frontend buildable apparaît, il est compilé automatiquement.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

run() {
  local label="$1"
  shift
  echo
  echo "==> $label"
  "$@"
}

echo "Déploiement vitrine — $ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Ce dossier n'est pas un dépôt git." >&2
  exit 1
fi

TARGET_REF="${DEPLOY_REF:-origin/main}"

# Sécurité : ne jamais perdre la config mail / anti-bot (hors git).
CONFIG_SRC="$ROOT/forms/config.php"
CONFIG_BAK="$(mktemp)"
if [[ -f "$CONFIG_SRC" ]]; then
  cp -a "$CONFIG_SRC" "$CONFIG_BAK"
  echo "Config mail sauvegardée."
else
  rm -f "$CONFIG_BAK"
  CONFIG_BAK=""
  echo "Attention : forms/config.php absent avant déploiement." >&2
fi

run "git fetch origin" git fetch origin --prune
run "git checkout main" git checkout main
run "git reset --hard ${TARGET_REF}" git reset --hard "$TARGET_REF"

# Contournement éventuel CRLF sur scripts.
find "$ROOT/scripts" -name '*.sh' -exec sed -i 's/\r$//' {} + 2>/dev/null || true

if [[ -n "$CONFIG_BAK" && -f "$CONFIG_BAK" ]]; then
  mkdir -p "$ROOT/forms"
  cp -a "$CONFIG_BAK" "$CONFIG_SRC"
  chmod 640 "$CONFIG_SRC"
  rm -f "$CONFIG_BAK"
  echo "Config mail restaurée."
fi

# Runtime anti-spam (rate limit) + droits PHP-FPM.
mkdir -p "$ROOT/forms/runtime/rate"
if command -v sudo >/dev/null 2>&1; then
  if [[ -n "${DEPLOY_SUDO_PASSWORD:-}" ]]; then
    printf '%s\n' "$DEPLOY_SUDO_PASSWORD" | sudo -S -k true >/dev/null 2>&1 || true
    printf '%s\n' "$DEPLOY_SUDO_PASSWORD" | sudo -S bash -c "
      chgrp www-data '$ROOT/forms' '$ROOT/forms/config.php' '$ROOT/forms/send_mail.py' 2>/dev/null || true
      chown -R dusunceli:www-data '$ROOT/forms/runtime'
      chmod 750 '$ROOT/forms'
      chmod 640 '$ROOT/forms/config.php' 2>/dev/null || true
      chmod 750 '$ROOT/forms/send_mail.py' 2>/dev/null || true
      chmod 770 '$ROOT/forms/runtime' '$ROOT/forms/runtime/rate'
    " || echo "sudo droits : non critique, suite du déploiement."
  else
    # NOPASSWD éventuel
    sudo -n bash -c "
      chgrp www-data '$ROOT/forms' '$ROOT/forms/config.php' '$ROOT/forms/send_mail.py' 2>/dev/null || true
      mkdir -p '$ROOT/forms/runtime/rate'
      chown -R \"\$(id -un)\":www-data '$ROOT/forms/runtime' 2>/dev/null || true
      chmod 770 '$ROOT/forms/runtime' '$ROOT/forms/runtime/rate' 2>/dev/null || true
    " 2>/dev/null || {
      chmod 750 "$ROOT/forms" 2>/dev/null || true
      chmod 770 "$ROOT/forms/runtime" "$ROOT/forms/runtime/rate" 2>/dev/null || true
    }
  fi
fi

# Build front optionnel (si le dépôt évolue vers un outil type Vite/npm).
if [[ -f "$ROOT/package.json" ]]; then
  if [[ -f "$ROOT/package-lock.json" ]]; then
    run "npm ci" npm ci
  else
    run "npm install" npm install
  fi
  if npm run | grep -qE '^  build'; then
    run "npm run build" npm run build
  fi
elif [[ -f "$ROOT/frontend/package.json" ]]; then
  cd "$ROOT/frontend"
  if [[ -f package-lock.json ]]; then
    run "npm ci (frontend)" npm ci
  else
    run "npm install (frontend)" npm install
  fi
  if npm run | grep -qE '^  build'; then
    run "npm run build (frontend)" npm run build
  fi
  cd "$ROOT"
else
  echo
  echo "==> Pas de package.json — site statique, aucun build npm"
fi

# Pas de reload nginx obligatoire pour du HTML/PHP déjà routé.
# Reload uniquement si une conf nginx versionnée a changé et si sudo dispo.
if [[ -f "$ROOT/deploy/nginx/ossatura-vitrine.conf" ]] && command -v sudo >/dev/null 2>&1; then
  echo
  echo "==> Conf nginx détectée dans le dépôt (reload si possible)"
  if [[ -n "${DEPLOY_SUDO_PASSWORD:-}" ]]; then
    printf '%s\n' "$DEPLOY_SUDO_PASSWORD" | sudo -S nginx -t && \
      printf '%s\n' "$DEPLOY_SUDO_PASSWORD" | sudo -S systemctl reload nginx || true
  else
    sudo -n nginx -t 2>/dev/null && sudo -n systemctl reload nginx 2>/dev/null || true
  fi
fi

SITE_URL="${SITE_URL:-https://ossatura.duckdns.org}"
echo
echo "==> Smoke checks"
curl -fsS -o /dev/null -w "index:%{http_code}\n" "$SITE_URL/index.html"
curl -fsS -o /dev/null -w "contact:%{http_code}\n" "$SITE_URL/contact.html"
curl -fsS -o /dev/null -w "finance:%{http_code}\n" "$SITE_URL/finance.html"
TOKEN_CODE="$(curl -fsS -o /tmp/oss_token.json -w "%{http_code}" "$SITE_URL/form-token.php" || true)"
echo "form-token:${TOKEN_CODE:-000}"
if [[ "${TOKEN_CODE:-}" == "200" ]]; then
  python3 -c 'import json; d=json.load(open("/tmp/oss_token.json")); assert d.get("ok") and d.get("token")' \
    || { echo "Jeton formulaire invalide." >&2; exit 1; }
fi

echo
echo "Déploiement terminé — $(git rev-parse --short HEAD)"
