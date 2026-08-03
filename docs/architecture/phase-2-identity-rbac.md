# Phase 2: Identity and RBAC

## Scope

This phase introduces the first complete business slice across the Vue
application, NestJS API, Prisma, and PostgreSQL:

- account authentication and profile loading;
- short-lived JWT access tokens;
- rotating refresh sessions stored as SHA-256 hashes;
- users, roles, permissions, menus, and their join tables;
- server-driven menus mapped onto the existing Vue route components;
- account administration and role access administration;
- deterministic development seed data.

The existing Pinia stores, Vue Router guards, KeepAlive behavior, static route
component map, and mock API remain in place. Set `VITE_USE_MOCK=0` to exercise
the real API.

## Data model

```text
User --< UserRole >-- Role --< RolePermission >-- Permission
                         |
                         +--< RoleMenu >-- Menu --< Menu

User --< RefreshSession
```

`RefreshSession` stores only a token hash. Access tokens identify both the user
and session, so rotating or revoking a session invalidates its previous access
token immediately.

Account deletion is a soft delete. Disabled and deleted accounts cannot
authenticate, and their active refresh sessions are revoked.

## API

All endpoints use the common response envelope from Phase 1.

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/profile`
- `GET /api/auth/menus`
- `POST /api/auth/logout`

The refresh token is sent in an HttpOnly cookie scoped to `/api/auth`. The
frontend keeps only the access token and performs a single-flight refresh when
parallel requests receive `401`.

### Identity administration

- `GET /api/system/accounts`
- `POST /api/system/accounts`
- `PATCH /api/system/accounts/:id`
- `DELETE /api/system/accounts/:id`
- `GET /api/system/roles`
- `GET /api/system/permissions`
- `GET /api/system/menus`
- `PUT /api/system/roles/:id/access`

Authentication and permission guards are global. Public endpoints must opt out
explicitly with `@Public()`, while protected administration endpoints declare
their required permissions with `@RequirePermissions(...)`.

## Development data

Run:

```shell
pnpm db:seed
```

The seed is idempotent and synchronizes the built-in role matrices and menu
assignments on each run.

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `nebula123` | `super_admin` |
| `manager` | `nebula123` | `admin` |
| `operator` | `nebula123` | `operator` |

These credentials are development-only.

## Local workflow

```shell
docker compose -f compose.dev.yaml up -d --build
pnpm db:seed
pnpm dev:web
```

The API is available at `http://localhost:8888/api`. The Vite development
origin is allowed by the Compose CORS configuration. To use the real API,
configure:

```dotenv
VITE_USE_MOCK=0
VITE_API_BASE_URL=http://localhost:8888/api
```

Production must override `JWT_SECRET`, database credentials, CORS origins, and
cookie security settings. HTTPS deployments should use `COOKIE_SECURE=true`.

## Verified behavior

The integration smoke test covers:

- health and database connectivity;
- super-administrator login and profile loading;
- dynamic menu and account/role reads;
- HttpOnly refresh cookie creation;
- refresh-token rotation and old-token rejection;
- logout and immediate access-token rejection;
- operator denial (`403`) on role administration.

## Next phase boundary

Operation logs, system configuration, statistics, project/game management, the
Agent workbench, WebSocket/SSE transport, production Nginx, and production web
images remain separate modules. They should be added incrementally on this
foundation rather than folded into the identity domain.
