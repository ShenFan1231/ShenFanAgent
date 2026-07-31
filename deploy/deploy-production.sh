#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="${PROJECT_DIR:-/opt/nebula-admin}"
release_version="${1:-}"
env_file="${project_dir}/.env.production.local"
base_compose="${project_dir}/compose.prod.yaml"
https_compose="${project_dir}/compose.https.yaml"

if [[ ! "${release_version}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "A full 40-character Git commit SHA is required." >&2
  exit 1
fi

cd "${project_dir}"

for required_file in \
  "${env_file}" \
  "${base_compose}" \
  "${https_compose}" \
  "${project_dir}/deploy/nginx.https.conf"; do
  if [[ ! -f "${required_file}" ]]; then
    echo "Required production file is missing: ${required_file}" >&2
    exit 1
  fi
done

export APP_VERSION="${release_version}"

compose=(
  docker compose
  --env-file "${env_file}"
  -f "${base_compose}"
  -f "${https_compose}"
)

"${compose[@]}" config --quiet
"${compose[@]}" build migrate api web
"${compose[@]}" up -d --remove-orphans

healthy=false
for _ in $(seq 1 45); do
  if curl --fail --silent --show-error \
    --max-time 5 \
    "https://shenfan1231.top/healthz" >/dev/null \
    && curl --fail --silent --show-error \
      --max-time 5 \
      "https://shenfan1231.top/api/health" >/dev/null; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "${healthy}" != "true" ]]; then
  echo "Production health checks failed." >&2
  "${compose[@]}" ps >&2
  "${compose[@]}" logs --tail 100 api web >&2
  exit 1
fi

if grep -q '^APP_VERSION=' "${env_file}"; then
  sed -i "s/^APP_VERSION=.*/APP_VERSION=${release_version}/" "${env_file}"
else
  printf '\nAPP_VERSION=%s\n' "${release_version}" >> "${env_file}"
fi
chmod 0600 "${env_file}"

"${compose[@]}" ps
echo "Production release ${release_version} is healthy."
