#!/usr/bin/env bash
set -euo pipefail

project_dir="${1:-/opt/nebula-admin}"
public_origin="${2:-http://127.0.0.1}"
agent_env="${3:-/root/nebula-agent.env}"

template="${project_dir}/.env.production.example"
target="${project_dir}/.env.production.local"

if [[ ! -f "${template}" ]]; then
  echo "Production environment template is missing." >&2
  exit 1
fi

if [[ ! -f "${agent_env}" ]]; then
  echo "Agent environment file is missing." >&2
  exit 1
fi

deepseek_key="$(sed -n 's/^DEEPSEEK_API_KEY=//p' "${agent_env}" | head -n 1)"
if [[ -z "${deepseek_key}" ]]; then
  echo "DEEPSEEK_API_KEY is missing." >&2
  exit 1
fi

postgres_password="$(openssl rand -hex 32)"
jwt_secret="$(openssl rand -hex 64)"
app_version="$(date -u +%Y%m%d%H%M%S)"

install -m 0600 "${template}" "${target}"
sed -i \
  -e "s|^APP_VERSION=.*|APP_VERSION=${app_version}|" \
  -e "s|^PUBLIC_ORIGIN=.*|PUBLIC_ORIGIN=${public_origin}|" \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${postgres_password}|" \
  -e "s|^JWT_SECRET=.*|JWT_SECRET=${jwt_secret}|" \
  -e "s|^DEEPSEEK_API_KEY=.*|DEEPSEEK_API_KEY=${deepseek_key}|" \
  "${target}"

chmod 0600 "${target}"
rm -f "${agent_env}"

echo "Production environment created."
