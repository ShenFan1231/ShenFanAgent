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

The first IP-based acceptance uses HTTP and `COOKIE_SECURE=false`. After DNS
points a domain to the server, enable HTTPS, set `PUBLIC_ORIGIN` to the final
`https://` origin, change `COOKIE_SECURE=true`, and recreate the API container.

SSE proxy buffering must remain disabled after the TLS configuration is added.
