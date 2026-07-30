#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

project_dir="${1:-/opt/nebula-admin}"
domain="${2:-shenfan1231.top}"
expected_ip="${3:-47.242.5.16}"
env_file="${project_dir}/.env.production.local"
base_compose="${project_dir}/compose.prod.yaml"
https_compose="${project_dir}/compose.https.yaml"

cd "${project_dir}"

resolved_ips="$(getent ahostsv4 "${domain}" | awk '{print $1}' | sort -u)"
if ! grep -qx "${expected_ip}" <<<"${resolved_ips}"; then
  echo "${domain} does not resolve to ${expected_ip}." >&2
  echo "Current IPv4 results:" >&2
  printf '%s\n' "${resolved_ips}" >&2
  exit 1
fi

docker compose \
  --env-file "${env_file}" \
  -f "${base_compose}" \
  --profile certbot \
  run --rm certbot \
  certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --domain "${domain}" \
  --domain "www.${domain}" \
  --agree-tos \
  --no-eff-email \
  --register-unsafely-without-email \
  --non-interactive

sed -i \
  -e "s|^PUBLIC_ORIGIN=.*|PUBLIC_ORIGIN=https://${domain}|" \
  -e "s|^COOKIE_SECURE=.*|COOKIE_SECURE=true|" \
  "${env_file}"
chmod 0600 "${env_file}"

docker compose \
  --env-file "${env_file}" \
  -f "${base_compose}" \
  -f "${https_compose}" \
  up -d --force-recreate api web

"${project_dir}/deploy/install-cert-renewal.sh" "${project_dir}"

echo "HTTPS enabled for https://${domain}"
