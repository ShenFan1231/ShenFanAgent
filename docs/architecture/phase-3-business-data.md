# Phase 3: Business data modules

## Scope

Phase 3 moves the existing presentation pages from generated mock data to
PostgreSQL-backed NestJS modules and adds the first project-management slice.

Completed domains:

- Dashboard metrics, trends, system status, traffic sources, and regions;
- orders and order details;
- system settings with persistent updates;
- automatic operation auditing and paginated log browsing;
- game, application, and AI Agent project management;
- per-user notification read state;
- mock-mode compatibility for the new frontend contracts.

AI conversations, streaming responses, tool execution, and task orchestration
remain Phase 4.

## Data model

The migration `20260730065608_phase3_business_data` adds:

- `Order`
- `DailyMetric`
- `TrafficSourceMetric`
- `RegionMetric`
- `SystemSetting`
- `OperationLog`
- `Project`
- `Notification`
- `NotificationRead`

Project types are `GAME`, `APPLICATION`, and `AI_AGENT`. Project archival is a
state transition rather than a destructive database delete.

## API

### Dashboard

- `GET /api/dashboard/overview`
- `GET /api/dashboard/trend?range=7d|30d|90d`
- `GET /api/dashboard/activities`
- `GET /api/dashboard/system-status`
- `GET /api/dashboard/traffic-sources`
- `GET /api/dashboard/regions`

### Orders and notifications

- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `GET /api/notifications`
- `POST /api/notifications/read-all`

### System

- `GET /api/system/settings`
- `PUT /api/system/settings`
- `GET /api/system/operation-logs`

### Projects

- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`

The delete endpoint archives a project. Controllers declare RBAC permissions
and all authenticated write operations are captured by the global operation
audit interceptor.

## Frontend integration

- Dashboard and Analytics use real daily metrics.
- Order list and detail use dedicated real endpoints.
- System settings load and save PostgreSQL values.
- Operation logs provide filtering and pagination.
- Project management provides filters, visual delivery progress, creation, and
  controlled progress updates.
- Server menus include Project Management and Operation Logs.
- Existing Pinia, Vue Router, dynamic route filtering, KeepAlive, dark mode,
  ECharts, and GSAP infrastructure are preserved.

## Development seed

`pnpm db:seed` synchronizes:

- 90 days of daily metrics;
- 72 orders;
- 5 traffic sources and 5 regions;
- 9 system settings;
- 4 projects;
- 3 notifications;
- initial operation log records.

## Verification

The API smoke test verifies all Phase 3 reads, project writes, settings
persistence, automatic audit creation, and operator RBAC denial for system
settings.

Browser verification covers:

- populated Dashboard without missing API errors;
- project cards from PostgreSQL;
- operation log table;
- persisted system settings;
- 72-order list and dedicated order detail route.
