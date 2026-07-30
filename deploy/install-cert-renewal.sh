#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

project_dir="${1:-/opt/nebula-admin}"
env_file="${project_dir}/.env.production.local"
base_compose="${project_dir}/compose.prod.yaml"
https_compose="${project_dir}/compose.https.yaml"

cat > /etc/systemd/system/nebula-cert-renew.service <<EOF
[Unit]
Description=Renew the NEBULA TLS certificate
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
WorkingDirectory=${project_dir}
ExecStart=/usr/bin/docker compose --env-file ${env_file} -f ${base_compose} -f ${https_compose} --profile certbot run --rm certbot renew --webroot --webroot-path /var/www/certbot --quiet
ExecStartPost=/usr/bin/docker compose --env-file ${env_file} -f ${base_compose} -f ${https_compose} exec -T web nginx -s reload
EOF

cat > /etc/systemd/system/nebula-cert-renew.timer <<'EOF'
[Unit]
Description=Check the NEBULA TLS certificate twice daily

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now nebula-cert-renew.timer
systemctl list-timers nebula-cert-renew.timer --no-pager
