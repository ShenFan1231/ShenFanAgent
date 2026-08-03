#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="${PROJECT_DIR:-/opt/nebula-admin}"
release_version="${1:-}"
env_file="${project_dir}/.env.production.local"
base_compose="${project_dir}/compose.prod.yaml"
https_compose="${project_dir}/compose.https.yaml"
cleanup_script="${project_dir}/deploy/cleanup-docker.sh"
cleanup_free_gb="${CLEANUP_FREE_GB:-15}"
abort_free_gb="${ABORT_FREE_GB:-8}"

if [[ ! "${release_version}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "A full 40-character Git commit SHA is required." >&2
  exit 1
fi

cd "${project_dir}"

for required_file in \
  "${env_file}" \
  "${base_compose}" \
  "${https_compose}" \
  "${project_dir}/deploy/nginx.https.conf" \
  "${cleanup_script}"; do
  if [[ ! -f "${required_file}" ]]; then
    echo "Required production file is missing: ${required_file}" >&2
    exit 1
  fi
done

export APP_VERSION="${release_version}"
# The production host has 2 GiB of RAM. Serial builds prevent API, migration,
# and web image builds from exhausting memory and swap at the same time.
export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}"

previous_release_version="$(
  sed -n 's/^APP_VERSION=//p' "${env_file}" |
    head -n 1
)"

free_disk_bytes() {
  df -PB1 "${project_dir}" |
    awk 'NR == 2 { print $4 }'
}

cleanup_threshold_bytes=$((cleanup_free_gb * 1024 * 1024 * 1024))
abort_threshold_bytes=$((abort_free_gb * 1024 * 1024 * 1024))
available_bytes="$(free_disk_bytes)"

echo "Pre-deployment disk state:"
df -h "${project_dir}"
docker system df

if (( available_bytes < cleanup_threshold_bytes )); then
  echo "Available disk is below ${cleanup_free_gb}GB; running guarded cleanup before the build."
  if ! "${cleanup_script}" --apply; then
    echo "Pre-deployment cleanup reported an error; disk safety will be checked again." >&2
  fi
  available_bytes="$(free_disk_bytes)"
fi

if (( available_bytes < abort_threshold_bytes )); then
  echo "Deployment stopped: less than ${abort_free_gb}GB is available after cleanup." >&2
  df -h "${project_dir}" >&2
  exit 1
fi

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

set_env_value() {
  local key="$1"
  local value="$2"

  if grep -q "^${key}=" "${env_file}"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${env_file}"
  else
    printf '\n%s=%s\n' "${key}" "${value}" >> "${env_file}"
  fi
}

set_env_value "APP_VERSION" "${release_version}"
if [[ "${previous_release_version}" =~ ^[0-9a-f]{40}$ ]] \
  && [[ "${previous_release_version}" != "${release_version}" ]]; then
  set_env_value "PREVIOUS_APP_VERSION" "${previous_release_version}"
fi
chmod 0600 "${env_file}"

if ! "${cleanup_script}" \
  --apply \
  --current-version "${release_version}" \
  --previous-version "${previous_release_version}"; then
  echo "WARNING: Production is healthy, but post-deployment cleanup reported an error." >&2
fi

"${compose[@]}" ps
echo "Production release ${release_version} is healthy."
