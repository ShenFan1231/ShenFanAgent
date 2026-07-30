# Phase 4: AI Agent workbench

## Scope

Phase 4 adds an end-to-end Agent execution path rather than a static chat
mockup. Conversations, messages, runs, progress, and tool calls are persisted
in PostgreSQL. NestJS streams observable execution events to the Vue workbench
over authenticated SSE.

Completed capabilities:

- conversation list, creation, and conversation history;
- user and assistant message persistence;
- independently queryable Agent runs and task progress;
- persisted tool call input, output, status, and timing;
- authenticated SSE streaming for run, progress, tool, and message events;
- RBAC permissions and a server-driven Agent menu;
- a responsive three-column workbench with mobile fallbacks;
- mock-mode compatibility;
- seeded Agent history for all three demo accounts.

## Data model

Migration `20260730073122_phase4_agent_workbench` adds:

- `AgentConversation`
- `AgentMessage`
- `AgentRun`
- `AgentToolCall`

Messages have a conversation-local sequence number. Runs reference the
requesting user and contain provider/model metadata, progress, step counts,
timestamps, and failure details. Tool calls are first-class records so a run
can be audited after its stream has ended.

## Backend architecture

The Agent module follows the existing Controller / Service / Repository
layers:

- `AgentController` owns HTTP contracts and RBAC declarations;
- `AgentService` coordinates run ownership, event streaming, and persistence;
- `AgentRepository` contains Prisma transactions and queries;
- `AgentProvider` is a replaceable provider boundary;
- `LocalDemoAgentProvider` supplies deterministic local execution without a
  paid model key;
- `DeepSeekAgentProvider` connects the same Agent flow to DeepSeek's
  OpenAI-compatible Chat Completions API.

The active implementation is selected through `AGENT_PROVIDER`. The API and
frontend event contract do not change when switching providers.

### DeepSeek configuration

Local secrets belong in the ignored `server/.env.local` file:

```dotenv
AGENT_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-local-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_MS=60000
```

Docker Compose loads this file when it exists. It is optional so a fresh clone
continues to work with the local provider. The DeepSeek provider sends recent
user and assistant messages to support multi-round conversation, while the
existing Service/Repository layer continues to own SSE events and persistence.
For DeepSeek, the provider requests `stream: true` and relays each upstream
network batch as `message.delta`; it does not wait for a complete answer and
then simulate streaming by locally slicing the result. The upstream `[DONE]`
marker, timeout, and client disconnect all cancel the response reader cleanly.

## API

- `GET /api/agent/conversations`
- `POST /api/agent/conversations`
- `GET /api/agent/conversations/:id`
- `POST /api/agent/conversations/:id/runs`
- `GET /api/agent/runs/:id`
- `GET /api/agent/runs/:id/events`

The event endpoint returns `text/event-stream` and requires both JWT
authentication and the `agent:run` permission.

## Stream contract

Events use a common envelope containing `type`, `runId`, `timestamp`, and
`data`. A successful execution emits:

1. `run.started`
2. `message.delta`
3. `tool.started`
4. `task.progress`
5. `tool.completed`
6. additional `message.delta` events
7. `message.completed`
8. `run.completed`

Failures emit `run.failed` and persist the failure on the run.

## Frontend workbench

The desktop layout contains:

- conversation navigation;
- the streaming chat surface and task composer;
- run progress, provider/model metadata, and Tool call inspection.

At narrow breakpoints the chat remains the primary surface. Existing Pinia,
dynamic Vue Router filtering, KeepAlive, dark mode, and the project component
system are preserved.

The frontend uses authenticated `fetch` for SSE because native `EventSource`
cannot attach the existing bearer token. Standard JSON calls continue to use
the shared API layer and its interceptors.

## Permissions and seed data

Phase 4 adds:

- `agent:view`
- `agent:run`

The dynamic menu route is `AgentWorkbench` at `/agent/workbench`. Super admin,
admin, and operator demo accounts can view and run Agent tasks. The seed
creates one completed conversation, two messages, one run, and one Tool call
for each demo account.

## Verification

Verification covers:

- complete frontend and backend production builds;
- Docker image rebuild and API/database health;
- real JWT login and Agent conversation reads;
- run creation and the full authenticated SSE event sequence;
- persisted completion status, assistant answer, and Tool calls;
- browser navigation to the development page;
- an actual browser-submitted prompt and streamed final answer;
- DeepSeek provider/model persistence and multi-round context verification when
  DeepSeek is enabled.
