# Phase 1: Full-stack foundation

## Scope

This phase adds the backend and development infrastructure without changing
existing pages, routes, stores, permissions, or mock handlers.

## Current frontend audit

- Vue, Pinia, Vue Router, Axios, UnoCSS, ECharts, and GSAP are already present.
- The API layer is centralized under `src/api` and `src/utils/request.ts`.
- The request client already supports response envelopes, request IDs,
  cancellation, retries, global errors, and token injection.
- Route guards already filter static asynchronous routes by roles and
  permissions.
- Tabs and KeepAlive already use per-tab cache keys and explicitly evict
  closed or refreshed entries.
- Mock requests are attached through an Axios adapter and can be disabled with
  `VITE_USE_MOCK=0`.

These parts should be evolved in place rather than replaced.

## Added architecture

```text
Vue application
  -> /api/*
  -> NestJS
       -> global request context
       -> validation / response / exception pipeline
       -> domain controller
       -> domain service
       -> domain repository (introduced with each domain)
       -> Prisma
       -> PostgreSQL
```

The first endpoint is `GET /api/health`. Its response uses the same envelope
already expected by the frontend:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "status": "ok",
    "database": "up",
    "uptime": 42
  },
  "timestamp": 0,
  "traceId": "..."
}
```

## Local development

1. Copy `server/.env.example` to `server/.env`.
2. Start PostgreSQL with `docker compose -f compose.dev.yaml up postgres -d`.
3. Generate the Prisma client with `pnpm db:generate`.
4. Start the API with `pnpm dev:api`.
5. Keep the existing mock frontend with `pnpm dev:web`, or set
   `VITE_USE_MOCK=0` to send requests to the API.

The complete API container can be started with:

```shell
docker compose -f compose.dev.yaml up --build
```

## Design boundaries

- No authentication or RBAC tables are introduced in this phase.
- No empty repository abstractions are added. A repository will be added when
  the first domain query exists.
- PostgreSQL is the only required infrastructure service.
- Redis, queues, WebSockets, and AI providers remain out of scope until a
  concrete module needs them.
- Production web images and Nginx are reserved for the deployment phase.

## Phase 2 entry point

The next reviewed migration should introduce users, roles, permissions, menus,
join tables, and refresh-token sessions as one coherent identity model. The
existing mock contract must remain available while endpoints are migrated one
module at a time.
