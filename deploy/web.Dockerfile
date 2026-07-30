FROM node:22-alpine AS builder

WORKDIR /workspace
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/package.json
RUN pnpm install --frozen-lockfile --filter admin...

COPY index.html tsconfig.app.json tsconfig.json tsconfig.node.json uno.config.ts vite.config.ts ./
COPY public public
COPY src src

ARG VITE_APP_BASE=/
ARG VITE_API_BASE_URL=/api
ARG VITE_REQUEST_TIMEOUT=60000
ARG VITE_USE_MOCK=0

ENV VITE_APP_BASE=${VITE_APP_BASE}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_REQUEST_TIMEOUT=${VITE_REQUEST_TIMEOUT}
ENV VITE_USE_MOCK=${VITE_USE_MOCK}

RUN pnpm run build:web

FROM nginx:1.27-alpine AS runner

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/dist /usr/share/nginx/html

EXPOSE 80
