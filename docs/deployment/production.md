# Production deployment

## Topology

The first public release runs on one Ubuntu host:

- Nginx serves the Vue production bundle and proxies `/api`;
- NestJS is reachable only from the internal frontend network;
- PostgreSQL is reachable only from the internal backend network;
- authenticated Agent events use the same-origin `/api` SSE path;
- Docker volumes persist PostgreSQL data;
- container JSON logs are size-limited.

Only ports `22`, `80`, and `443` should be allowed by the cloud firewall.
Ports `5432` and `8080` must not be published.

## Local production validation

Copy the template and replace every placeholder:

```bash
cp .env.production.example .env.production.local
docker compose --env-file .env.production.local -f compose.prod.yaml up -d --build
docker compose --env-file .env.production.local -f compose.prod.yaml --profile seed run --rm seed
```

Check:

```bash
docker compose --env-file .env.production.local -f compose.prod.yaml ps
curl --fail http://127.0.0.1/healthz
curl --fail http://127.0.0.1/api/health
```

## Ubuntu host bootstrap

Run `deploy/bootstrap-ubuntu.sh` as root. It installs Docker Engine and the
Compose plugin from Docker's official repository, creates a persistent 2 GiB
swap file for the 2 GiB host, enables Docker at boot, and configures UFW.

Deploy the repository to `/opt/nebula-admin`, create the ignored
`.env.production.local`, then run the same Compose commands shown above.

## Secrets

The following values must be unique production secrets:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `DEEPSEEK_API_KEY`

The production secret file is ignored by Git. Do not store these values in
screenshots, shell history, Dockerfiles, Compose files, or repository secrets
that are exposed to pull requests.

## HTTPS transition

The first IP-based acceptance can use HTTP and `COOKIE_SECURE=false`. Before
enabling HTTPS, publish these DNS records:

```text
@    A       47.242.5.16
www  CNAME   shenfan1231.top
```

Recreate the HTTP web container once so that the ACME challenge volume and
location are active:

```bash
docker compose --env-file .env.production.local -f compose.prod.yaml up -d --build web
```

After both names resolve to the server, issue the certificate and switch the
stack to the HTTPS override:

```bash
chmod +x deploy/enable-https.sh deploy/install-cert-renewal.sh
deploy/enable-https.sh /opt/nebula-admin shenfan1231.top 47.242.5.16
```

The script:

- requests a Let's Encrypt certificate through the HTTP webroot challenge;
- changes `PUBLIC_ORIGIN` to `https://shenfan1231.top`;
- changes `COOKIE_SECURE` to `true`;
- recreates the API and web containers with the HTTPS override;
- installs a systemd timer that checks renewal twice daily and reloads Nginx.

For future deployments, always include both Compose files:

```bash
docker compose \
  --env-file .env.production.local \
  -f compose.prod.yaml \
  -f compose.https.yaml \
  up -d --build
```

SSE proxy buffering must remain disabled after the TLS configuration is added.

## Continuous deployment

The `CI/CD` GitHub Actions workflow deploys every successful push to `main`.
Pull requests run the complete validation and build job but never receive the
production SSH secrets and never connect to the server.

The production deployment job:

1. checks out the exact `main` commit that passed CI;
2. uses a dedicated `deploy` account and pinned SSH host key;
3. synchronizes source to `/opt/nebula-admin` while preserving
   `.env.production.local`;
4. builds the web, API, and migration images with the full Git commit SHA as
   `APP_VERSION`;
5. applies Prisma migrations and recreates changed containers;
6. requires both HTTPS health endpoints to pass;
7. records the successfully deployed Git commit in `.env.production.local`.

The GitHub `production` environment contains these encrypted secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_PRIVATE_KEY`
- `DEPLOY_KNOWN_HOSTS`

Database credentials, JWT secrets, the DeepSeek API key, PostgreSQL data, and
TLS certificates remain on the server and are excluded from source
synchronization.
