#!/usr/bin/env bash
set -Eeuo pipefail

# Lightweight deploy script for self-hosting kibouFlow on a small Linux server.
# Defaults:
# - No Docker
# - Nginx + systemd + Next.js standalone
# - External PostgreSQL preferred; local PostgreSQL is optional
# - Keeps releases under APP_HOME/releases for safer rollouts
#
# Typical usage:
#   sudo bash deploy.sh
#
# Useful overrides:
#   APP_DOMAIN=example.com APP_EMAIL=ops@example.com sudo bash deploy.sh
#   DATABASE_URL=postgresql://... sudo bash deploy.sh
#   BUILD_ON_SERVER=0 sudo bash deploy.sh   # deploy prebuilt .next/standalone

APP_NAME="${APP_NAME:-kibouflow}"
APP_PORT="${APP_PORT:-3000}"
APP_USER="${APP_USER:-${SUDO_USER:-$(id -un)}}"
APP_GROUP="${APP_GROUP:-$APP_USER}"
APP_HOME="${APP_HOME:-/home/${APP_USER}/apps/${APP_NAME}}"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASES_DIR="${APP_HOME}/releases"
SHARED_DIR="${APP_HOME}/shared"
CURRENT_LINK="${APP_HOME}/current"
SERVICE_NAME="${SERVICE_NAME:-$APP_NAME}"

APP_DOMAIN="${APP_DOMAIN:-}"
APP_EMAIL="${APP_EMAIL:-}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-}"
DATABASE_URL="${DATABASE_URL:-}"
DB_PASSWORD="${DB_PASSWORD:-}"
ADMIN_GEO_PASSWORD="${ADMIN_GEO_PASSWORD:-}"
ADMIN_SESSION_SECRET="${ADMIN_SESSION_SECRET:-}"
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY:-}"
OPENAI_API_KEY="${OPENAI_API_KEY:-}"
GEO_AUDIT_OPENAI_MODEL="${GEO_AUDIT_OPENAI_MODEL:-chatgpt-5.4-mini}"
GEO_AUDIT_USE_LLM="${GEO_AUDIT_USE_LLM:-}"
GEO_AUDIT_PYTHON="${GEO_AUDIT_PYTHON:-python3}"

BUILD_ON_SERVER="${BUILD_ON_SERVER:-1}"
INSTALL_NGINX="${INSTALL_NGINX:-1}"
ENABLE_SSL="${ENABLE_SSL:-1}"
INSTALL_LOCAL_POSTGRES="${INSTALL_LOCAL_POSTGRES:-auto}"
CONFIGURE_SWAP="${CONFIGURE_SWAP:-auto}"
ENABLE_UFW="${ENABLE_UFW:-0}"

TOTAL_MEM_MB="$(awk '/MemTotal/ { printf "%d", $2 / 1024 }' /proc/meminfo)"
SWAP_MB="$(awk '/SwapTotal/ { printf "%d", $2 / 1024 }' /proc/meminfo)"
BUILD_HEAP_MB="${BUILD_HEAP_MB:-}"
RUNTIME_HEAP_MB="${RUNTIME_HEAP_MB:-}"

if [[ -z "$BUILD_HEAP_MB" ]]; then
  if (( TOTAL_MEM_MB <= 1024 )); then
    BUILD_HEAP_MB=512
  elif (( TOTAL_MEM_MB <= 2048 )); then
    BUILD_HEAP_MB=768
  else
    BUILD_HEAP_MB=1024
  fi
fi

if [[ -z "$RUNTIME_HEAP_MB" ]]; then
  if (( TOTAL_MEM_MB <= 1024 )); then
    RUNTIME_HEAP_MB=256
  elif (( TOTAL_MEM_MB <= 2048 )); then
    RUNTIME_HEAP_MB=384
  else
    RUNTIME_HEAP_MB=512
  fi
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${CYAN}[INFO]${NC} $*"; }
ok() { echo -e "${GREEN}[ OK ]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err() { echo -e "${RED}[ERR ]${NC} $*" >&2; }

cleanup_on_error() {
  err "Deployment failed on line $1"
}
trap 'cleanup_on_error $LINENO' ERR

require_root() {
  if [[ $EUID -ne 0 ]]; then
    err "Please run with sudo or as root."
    exit 1
  fi
}

has_tty() {
  [[ -t 0 ]]
}

prompt_value() {
  local var_name="$1"
  local prompt="$2"
  local secret="${3:-0}"
  local current="${!var_name:-}"

  if [[ -n "$current" ]]; then
    return
  fi

  if ! has_tty; then
    err "Missing required variable: $var_name"
    exit 1
  fi

  if [[ "$secret" == "1" ]]; then
    read -rsp "$prompt: " current
    echo ""
  else
    read -rp "$prompt: " current
  fi

  if [[ -z "$current" ]]; then
    err "$var_name cannot be empty."
    exit 1
  fi

  printf -v "$var_name" '%s' "$current"
}

prompt_yes_no() {
  local prompt="$1"
  local default="${2:-y}"
  local answer=""

  if ! has_tty; then
    [[ "$default" == "y" ]]
    return
  fi

  read -rp "$prompt [$([[ "$default" == "y" ]] && echo "Y/n" || echo "y/N")]: " answer
  answer="${answer:-$default}"
  [[ "${answer,,}" == "y" || "${answer,,}" == "yes" ]]
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

ensure_directory() {
  mkdir -p "$1"
}

random_hex() {
  openssl rand -hex "$1"
}

random_base64_32() {
  openssl rand -base64 32 | tr -d '\n'
}

ensure_swap_if_needed() {
  if [[ "$CONFIGURE_SWAP" == "0" || "$CONFIGURE_SWAP" == "false" ]]; then
    return
  fi

  if (( SWAP_MB > 0 )); then
    ok "Swap already exists (${SWAP_MB}MB)."
    return
  fi

  local target_swap_mb=0
  if [[ "$CONFIGURE_SWAP" == "1" || "$CONFIGURE_SWAP" == "true" ]]; then
    target_swap_mb=2048
  elif (( TOTAL_MEM_MB <= 1024 )); then
    target_swap_mb=2048
  elif (( TOTAL_MEM_MB <= 2048 )); then
    target_swap_mb=1024
  fi

  if (( target_swap_mb == 0 )); then
    info "Swap not required for current memory size."
    return
  fi

  warn "Low-memory host detected (${TOTAL_MEM_MB}MB RAM). Creating ${target_swap_mb}MB swap."
  fallocate -l "${target_swap_mb}M" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  sysctl -w vm.swappiness=10 >/dev/null
  if ! grep -q '^vm.swappiness=10$' /etc/sysctl.conf; then
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
  fi
  ok "Swap configured."
}

install_base_packages() {
  info "Installing base packages."
  apt-get update -y

  local packages=(
    ca-certificates
    curl
    git
    gnupg
    python3
    rsync
    build-essential
    postgresql-client
  )

  if [[ "$INSTALL_NGINX" == "1" || "$INSTALL_NGINX" == "true" ]]; then
    packages+=(nginx)
    if [[ "$ENABLE_SSL" == "1" || "$ENABLE_SSL" == "true" ]]; then
      packages+=(python3-certbot-nginx certbot)
    fi
  fi

  if [[ "$ENABLE_UFW" == "1" || "$ENABLE_UFW" == "true" ]]; then
    packages+=(ufw)
  fi

  apt-get install -y "${packages[@]}"
  ok "Base packages installed."
}

install_node_if_needed() {
  local need_node=1
  if command_exists node; then
    local node_major
    node_major="$(node -p "process.versions.node.split('.')[0]")"
    if (( node_major >= 20 )); then
      need_node=0
      ok "Node.js already available: $(node -v)"
    fi
  fi

  if (( need_node == 1 )); then
    info "Installing Node.js 20."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    ok "Node.js installed: $(node -v)"
  fi
}

detect_local_db_choice() {
  if [[ -n "$DATABASE_URL" ]]; then
    INSTALL_LOCAL_POSTGRES=0
    return
  fi

  case "$INSTALL_LOCAL_POSTGRES" in
    1|true|yes)
      INSTALL_LOCAL_POSTGRES=1
      ;;
    0|false|no)
      INSTALL_LOCAL_POSTGRES=0
      ;;
    auto)
      if has_tty; then
        if prompt_yes_no "No DATABASE_URL detected. Install PostgreSQL on this server?" "n"; then
          INSTALL_LOCAL_POSTGRES=1
        else
          err "DATABASE_URL is required when local PostgreSQL is not installed."
          exit 1
        fi
      else
        err "Set DATABASE_URL or INSTALL_LOCAL_POSTGRES=1."
        exit 1
      fi
      ;;
    *)
      err "Invalid INSTALL_LOCAL_POSTGRES value: $INSTALL_LOCAL_POSTGRES"
      exit 1
      ;;
  esac
}

install_and_tune_postgres() {
  if [[ "$INSTALL_LOCAL_POSTGRES" != "1" ]]; then
    return
  fi

  prompt_value DB_PASSWORD "PostgreSQL password for kibouflow user" 1

  info "Installing local PostgreSQL."
  apt-get install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql

  sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kibouflow') THEN
    CREATE ROLE kibouflow WITH LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE kibouflow WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE kibouflow OWNER kibouflow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kibouflow')\gexec
SQL

  DATABASE_URL="postgresql://kibouflow:${DB_PASSWORD}@127.0.0.1:5432/kibouflow"

  local pg_conf
  pg_conf="$(sudo -u postgres psql -Atqc "SHOW config_file;")"
  if [[ -n "$pg_conf" ]]; then
    local pg_dir
    pg_dir="$(dirname "$pg_conf")/conf.d"
    ensure_directory "$pg_dir"
    cat > "${pg_dir}/kibouflow-small.conf" <<EOF
shared_buffers = 128MB
effective_cache_size = 256MB
maintenance_work_mem = 64MB
work_mem = 4MB
max_connections = 20
EOF
    systemctl restart postgresql
  fi

  ok "Local PostgreSQL ready."
}

ensure_required_inputs() {
  prompt_value ADMIN_GEO_PASSWORD "Admin password (ADMIN_GEO_PASSWORD)" 1

  if [[ -z "$ADMIN_SESSION_SECRET" ]]; then
    ADMIN_SESSION_SECRET="$(random_hex 32)"
  fi

  if [[ -z "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" ]]; then
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(random_base64_32)"
  fi

  if [[ -z "$APP_DOMAIN" && "$ENABLE_SSL" == "1" ]]; then
    prompt_value APP_DOMAIN "Domain name for the site"
  fi

  if [[ "$ENABLE_SSL" == "1" && -z "$APP_EMAIL" ]]; then
    prompt_value APP_EMAIL "Email for Let's Encrypt"
  fi

  if [[ -z "$NEXT_PUBLIC_SITE_URL" ]]; then
    if [[ -n "$APP_DOMAIN" ]]; then
      NEXT_PUBLIC_SITE_URL="https://${APP_DOMAIN}"
    else
      NEXT_PUBLIC_SITE_URL="http://127.0.0.1:${APP_PORT}"
    fi
  fi

  if [[ -n "$OPENAI_API_KEY" && -z "$GEO_AUDIT_USE_LLM" ]]; then
    GEO_AUDIT_USE_LLM=1
  fi

  if [[ -z "$DATABASE_URL" ]]; then
    err "DATABASE_URL is still empty."
    exit 1
  fi
}

ensure_app_user_dirs() {
  ensure_directory "$APP_HOME"
  ensure_directory "$RELEASES_DIR"
  ensure_directory "$SHARED_DIR"
  chown -R "${APP_USER}:${APP_GROUP}" "$APP_HOME"
}

write_managed_env() {
  local managed_env="${SHARED_DIR}/deploy.env"
  local deploy_version
  deploy_version="$(date +%Y%m%d%H%M%S)"

  cat > "$managed_env" <<EOF
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
DATABASE_URL=${DATABASE_URL}
ADMIN_GEO_PASSWORD=${ADMIN_GEO_PASSWORD}
ADMIN_SESSION_SECRET=${ADMIN_SESSION_SECRET}
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY}
GEO_AUDIT_PYTHON=${GEO_AUDIT_PYTHON}
DEPLOYMENT_VERSION=${deploy_version}
EOF

  if [[ -n "$OPENAI_API_KEY" ]]; then
    cat >> "$managed_env" <<EOF
GEO_AUDIT_USE_LLM=${GEO_AUDIT_USE_LLM:-1}
OPENAI_API_KEY=${OPENAI_API_KEY}
GEO_AUDIT_OPENAI_MODEL=${GEO_AUDIT_OPENAI_MODEL}
EOF
  fi

  chmod 600 "$managed_env"

  local extra_env="${SHARED_DIR}/app.env"
  if [[ ! -f "$extra_env" ]]; then
    touch "$extra_env"
    chmod 600 "$extra_env"
  fi

  ok "Managed env written to ${managed_env}"
}

run_migrations() {
  local migrations_dir="${SOURCE_DIR}/supabase/migrations"
  if [[ ! -d "$migrations_dir" ]]; then
    warn "No supabase/migrations directory found. Skipping migrations."
    return
  fi

  info "Running SQL migrations."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS public.app_deploy_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SQL

  local sql_file filename applied
  while IFS= read -r sql_file; do
    filename="$(basename "$sql_file")"
    applied="$(psql "$DATABASE_URL" -Atqc "SELECT 1 FROM public.app_deploy_migrations WHERE filename='${filename}' LIMIT 1;")"
    if [[ "$applied" == "1" ]]; then
      info "Skipping already applied migration: ${filename}"
      continue
    fi

    info "Applying migration: ${filename}"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$sql_file"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO public.app_deploy_migrations (filename) VALUES ('${filename}')"
  done < <(find "$migrations_dir" -maxdepth 1 -type f -name '*.sql' | sort)

  ok "Migrations finished."
}

build_if_needed() {
  if [[ "$BUILD_ON_SERVER" == "0" || "$BUILD_ON_SERVER" == "false" ]]; then
    info "Skipping server-side build. Expecting prebuilt .next/standalone output."
  else
    info "Installing dependencies and building on server."
    (
      cd "$SOURCE_DIR"
      export NODE_OPTIONS="--max-old-space-size=${BUILD_HEAP_MB}"
      npm ci --no-audit --no-fund
      npm run build
    )
    ok "Build completed."
  fi

  if [[ ! -f "${SOURCE_DIR}/.next/standalone/server.js" ]]; then
    err "Missing .next/standalone/server.js. Build the app first or set BUILD_ON_SERVER=1."
    exit 1
  fi
}

assemble_release() {
  local release_id release_dir
  release_id="$(date +%Y%m%d%H%M%S)"
  release_dir="${RELEASES_DIR}/${release_id}"
  ensure_directory "$release_dir"

  info "Creating release at ${release_dir}"
  rsync -a "${SOURCE_DIR}/.next/standalone/" "${release_dir}/"
  ensure_directory "${release_dir}/.next"
  rsync -a "${SOURCE_DIR}/.next/static/" "${release_dir}/.next/static/"

  # These folders are needed at runtime:
  # - content/: article loading reads from process.cwd()/content
  # - scripts/: GEO audit launches Python scripts from process.cwd()/scripts
  # - src/ and docs/: GEO audit inspects repository files and docs as part of its checks
  for dir in public content scripts src docs; do
    if [[ -d "${SOURCE_DIR}/${dir}" ]]; then
      rsync -a "${SOURCE_DIR}/${dir}/" "${release_dir}/${dir}/"
    fi
  done

  chown -R "${APP_USER}:${APP_GROUP}" "$release_dir"
  ln -sfn "$release_dir" "$CURRENT_LINK"
  ok "Release assembled."
}

write_systemd_service() {
  local service_file="/etc/systemd/system/${SERVICE_NAME}.service"

  cat > "$service_file" <<EOF
[Unit]
Description=${APP_NAME} Next.js standalone service
After=network.target
Wants=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${CURRENT_LINK}
Environment=PORT=${APP_PORT}
Environment=HOSTNAME=127.0.0.1
Environment=NODE_OPTIONS=--max-old-space-size=${RUNTIME_HEAP_MB}
Environment=MALLOC_ARENA_MAX=2
Environment=UV_THREADPOOL_SIZE=2
EnvironmentFile=-${SHARED_DIR}/deploy.env
EnvironmentFile=-${SHARED_DIR}/app.env
ExecStart=$(command -v node) server.js
Restart=always
RestartSec=5
TimeoutStopSec=30
KillSignal=SIGTERM
NoNewPrivileges=true
PrivateTmp=true
LimitNOFILE=65535
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable "$SERVICE_NAME"
  systemctl restart "$SERVICE_NAME"
  ok "systemd service updated."
}

write_nginx_config() {
  if [[ "$INSTALL_NGINX" != "1" && "$INSTALL_NGINX" != "true" ]]; then
    return
  fi

  local conf_file="/etc/nginx/sites-available/${APP_NAME}"
  local server_name="${APP_DOMAIN:-_}"

  cat > "$conf_file" <<EOF
map \$http_upgrade \$connection_upgrade {
  default upgrade;
  '' close;
}

server {
  listen 80;
  listen [::]:80;
  server_name ${server_name};

  client_max_body_size 2m;
  server_tokens off;

  location /_next/static/ {
    alias ${CURRENT_LINK}/.next/static/;
    access_log off;
    expires 365d;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  location / {
    proxy_pass http://127.0.0.1:${APP_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;
    proxy_read_timeout 90s;
    proxy_send_timeout 90s;
    proxy_buffering off;
  }
}
EOF

  ln -sfn "$conf_file" "/etc/nginx/sites-enabled/${APP_NAME}"
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
  ok "Nginx updated."
}

configure_ssl_if_needed() {
  if [[ "$ENABLE_SSL" != "1" && "$ENABLE_SSL" != "true" ]]; then
    return
  fi

  if [[ "$INSTALL_NGINX" != "1" && "$INSTALL_NGINX" != "true" ]]; then
    warn "Skipping SSL because INSTALL_NGINX is disabled."
    return
  fi

  if [[ -z "$APP_DOMAIN" || -z "$APP_EMAIL" ]]; then
    warn "Skipping SSL because APP_DOMAIN or APP_EMAIL is missing."
    return
  fi

  info "Requesting or renewing Let's Encrypt certificate."
  certbot --nginx -d "$APP_DOMAIN" --email "$APP_EMAIL" --agree-tos --non-interactive --redirect || {
    warn "Certbot failed. Check DNS and rerun later."
    return
  }
  ok "SSL configured."
}

configure_firewall_if_needed() {
  if [[ "$ENABLE_UFW" != "1" && "$ENABLE_UFW" != "true" ]]; then
    return
  fi

  info "Configuring UFW."
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
  ufw --force enable
  ok "UFW configured."
}

smoke_test() {
  info "Running local smoke test."
  sleep 2

  if ! systemctl is-active --quiet "$SERVICE_NAME"; then
    err "Service is not active."
    journalctl -u "$SERVICE_NAME" --no-pager -n 50 || true
    exit 1
  fi

  curl -fsS "http://127.0.0.1:${APP_PORT}" >/dev/null
  ok "Application responds on localhost:${APP_PORT}"
}

print_summary() {
  cat <<EOF

============================================================
Deployment complete
============================================================
Source directory:      ${SOURCE_DIR}
App home:              ${APP_HOME}
Current release:       ${CURRENT_LINK}
Service name:          ${SERVICE_NAME}
Port:                  ${APP_PORT}
Site URL:              ${NEXT_PUBLIC_SITE_URL}
Database:              ${DATABASE_URL%%:*}://...
Server RAM:            ${TOTAL_MEM_MB}MB
Swap:                  $(awk '/SwapTotal/ { printf "%d", $2 / 1024 }' /proc/meminfo)MB
Build heap limit:      ${BUILD_HEAP_MB}MB
Runtime heap limit:    ${RUNTIME_HEAP_MB}MB

Useful commands:
  sudo systemctl status ${SERVICE_NAME}
  sudo systemctl restart ${SERVICE_NAME}
  sudo journalctl -u ${SERVICE_NAME} -f
  sudo nginx -t

Managed env:
  ${SHARED_DIR}/deploy.env

Custom env additions:
  ${SHARED_DIR}/app.env

Small-server notes:
  - External PostgreSQL is preferred when RAM is tight.
  - BUILD_ON_SERVER=0 is the safest option for very small machines.
  - Nginx now serves /_next/static directly to reduce Node CPU usage.
============================================================
EOF
}

main() {
  require_root

  echo ""
  echo "============================================================"
  echo "kibouFlow lightweight self-host deploy"
  echo "Source: ${SOURCE_DIR}"
  echo "Target: ${APP_HOME}"
  echo "RAM:    ${TOTAL_MEM_MB}MB"
  echo "Swap:   ${SWAP_MB}MB"
  echo "============================================================"
  echo ""

  detect_local_db_choice
  ensure_swap_if_needed
  install_base_packages
  install_node_if_needed
  install_and_tune_postgres
  ensure_required_inputs
  ensure_app_user_dirs
  write_managed_env
  run_migrations
  build_if_needed
  assemble_release
  write_systemd_service
  write_nginx_config
  configure_ssl_if_needed
  configure_firewall_if_needed
  smoke_test
  print_summary
}

main "$@"
