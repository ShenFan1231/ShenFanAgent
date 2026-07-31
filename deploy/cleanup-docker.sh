#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'EOF'
Usage: cleanup-docker.sh [--dry-run|--apply]
                         [--current-version VERSION]
                         [--previous-version VERSION]

Safely removes old NEBULA application image tags, old stopped Compose
containers, dangling images, and excess BuildKit cache. Docker volumes are
never removed.

The default mode is --dry-run.
EOF
}

mode="dry-run"
current_version=""
previous_version=""
project_dir="${PROJECT_DIR:-/opt/nebula-admin}"
keep_release_count="${KEEP_RELEASE_COUNT:-2}"
stopped_container_hours="${STOPPED_CONTAINER_HOURS:-24}"
build_cache_max_gb="${BUILD_CACHE_MAX_GB:-2}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      mode="dry-run"
      shift
      ;;
    --apply)
      mode="apply"
      shift
      ;;
    --current-version)
      if [[ $# -lt 2 ]]; then
        echo "--current-version requires a value." >&2
        exit 2
      fi
      current_version="$2"
      shift 2
      ;;
    --previous-version)
      if [[ $# -lt 2 ]]; then
        echo "--previous-version requires a value." >&2
        exit 2
      fi
      previous_version="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if ! [[ "${keep_release_count}" =~ ^[1-9][0-9]*$ ]]; then
  echo "KEEP_RELEASE_COUNT must be a positive integer." >&2
  exit 2
fi

if ! [[ "${stopped_container_hours}" =~ ^[0-9]+$ ]]; then
  echo "STOPPED_CONTAINER_HOURS must be a non-negative integer." >&2
  exit 2
fi

if ! [[ "${build_cache_max_gb}" =~ ^[1-9][0-9]*$ ]]; then
  echo "BUILD_CACHE_MAX_GB must be a positive integer." >&2
  exit 2
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is unavailable or the current user cannot access it." >&2
  exit 1
fi

env_file="${project_dir}/.env.production.local"
if [[ -z "${current_version}" && -f "${env_file}" ]]; then
  current_version="$(
    sed -n 's/^APP_VERSION=//p' "${env_file}" |
      head -n 1
  )"
fi
if [[ -z "${previous_version}" && -f "${env_file}" ]]; then
  previous_version="$(
    sed -n 's/^PREVIOUS_APP_VERSION=//p' "${env_file}" |
      head -n 1
  )"
fi

repositories=(
  "nebula-admin-api"
  "nebula-admin-web"
  "nebula-admin-maintenance"
)

echo "NEBULA Docker cleanup mode: ${mode}"
echo "Current release: ${current_version:-unknown}"
echo "Previous release: ${previous_version:-auto-detect}"
echo "Release retention: ${keep_release_count}"
echo "Build cache cap: ${build_cache_max_gb}GB"
echo "Stopped container retention: ${stopped_container_hours}h"
echo
echo "Storage before cleanup:"
df -h "${project_dir}"
docker system df

declare -A keep_tags=()
if [[ -n "${current_version}" ]]; then
  keep_tags["${current_version}"]=1
fi

is_complete_release() {
  local tag="$1"
  local repository

  for repository in "${repositories[@]}"; do
    if ! docker image inspect "${repository}:${tag}" >/dev/null 2>&1; then
      return 1
    fi
  done
}

mapfile -t release_candidates < <(
  docker image ls \
    --filter "reference=${repositories[0]}:*" \
    --format '{{.Tag}}' |
    while IFS= read -r tag; do
      if [[ -z "${tag}" || "${tag}" == "<none>" ]]; then
        continue
      fi

      if is_complete_release "${tag}"; then
        created="$(
          docker image inspect \
            --format '{{.Created}}' \
            "${repositories[0]}:${tag}"
        )"
        printf '%s|%s\n' "${created}" "${tag}"
      fi
    done |
    sort -r
)

if [[ -n "${previous_version}" ]] \
  && [[ "${previous_version}" != "${current_version}" ]] \
  && is_complete_release "${previous_version}"; then
  keep_tags["${previous_version}"]=1
fi

kept_count="${#keep_tags[@]}"
for candidate in "${release_candidates[@]}"; do
  tag="${candidate#*|}"

  if [[ -n "${keep_tags[${tag}]+set}" ]]; then
    continue
  fi

  if (( kept_count >= keep_release_count )); then
    break
  fi

  keep_tags["${tag}"]=1
  kept_count=$((kept_count + 1))
done

echo
echo "Release tags kept:"
if [[ "${#keep_tags[@]}" -eq 0 ]]; then
  echo "  none (no release tags were found)"
else
  for tag in "${!keep_tags[@]}"; do
    echo "  ${tag}"
  done
fi

cutoff_epoch="$(
  date -u \
    --date="-${stopped_container_hours} hours" \
    +%s
)"

echo
echo "Old stopped project containers:"
old_container_count=0
mapfile -t project_containers < <(
  docker ps -a \
    --filter "label=com.docker.compose.project=nebula-admin" \
    --format '{{.ID}}'
)

for container_id in "${project_containers[@]}"; do
  status="$(docker inspect --format '{{.State.Status}}' "${container_id}")"
  if [[ "${status}" != "exited" && "${status}" != "dead" ]]; then
    continue
  fi

  finished_at="$(docker inspect --format '{{.State.FinishedAt}}' "${container_id}")"
  if ! finished_epoch="$(date -u --date="${finished_at}" +%s 2>/dev/null)"; then
    echo "  skip ${container_id}: unreadable completion time ${finished_at}" >&2
    continue
  fi

  if (( finished_epoch > cutoff_epoch )); then
    continue
  fi

  container_name="$(
    docker inspect \
      --format '{{.Name}}' \
      "${container_id}"
  )"
  container_name="${container_name#/}"
  old_container_count=$((old_container_count + 1))

  if [[ "${mode}" == "apply" ]]; then
    echo "  remove ${container_name} (${container_id})"
    docker rm "${container_id}"
  else
    echo "  would remove ${container_name} (${container_id})"
  fi
done

if (( old_container_count == 0 )); then
  echo "  none"
fi

echo
echo "Old NEBULA image tags:"
old_image_count=0
for repository in "${repositories[@]}"; do
  mapfile -t repository_tags < <(
    docker image ls \
      --filter "reference=${repository}:*" \
      --format '{{.Tag}}'
  )

  for tag in "${repository_tags[@]}"; do
    if [[ -z "${tag}" || "${tag}" == "<none>" ]]; then
      continue
    fi

    if [[ -n "${keep_tags[${tag}]+set}" ]]; then
      continue
    fi

    image_ref="${repository}:${tag}"
    old_image_count=$((old_image_count + 1))

    if [[ "${mode}" == "apply" ]]; then
      echo "  remove ${image_ref}"
      if ! docker image rm "${image_ref}"; then
        echo "  warning: ${image_ref} is still referenced and was retained." >&2
      fi
    else
      echo "  would remove ${image_ref}"
    fi
  done
done

if (( old_image_count == 0 )); then
  echo "  none"
fi

echo
if [[ "${mode}" == "apply" ]]; then
  echo "Removing dangling image layers:"
  docker image prune --force

  echo
  echo "Reducing BuildKit cache to at most ${build_cache_max_gb}GB:"
  docker buildx prune \
    --force \
    --max-used-space "${build_cache_max_gb}GB"

  echo
  echo "Storage after cleanup:"
  df -h "${project_dir}"
  docker system df
else
  echo "Dry run only: dangling images and BuildKit cache were not changed."
  echo "Apply mode would cap BuildKit cache at ${build_cache_max_gb}GB."
fi

echo
echo "Docker volumes were not pruned or removed."
