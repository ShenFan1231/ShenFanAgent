FROM node:22-alpine AS dependencies

WORKDIR /workspace
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/package.json
RUN pnpm install --frozen-lockfile --filter @nebula/api...

FROM dependencies AS maintenance

COPY server server
WORKDIR /workspace/server
RUN pnpm prisma:generate

FROM dependencies AS builder

COPY server server
RUN pnpm --filter @nebula/api build
RUN pnpm --filter @nebula/api deploy --prod --legacy /app

FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache openssl
COPY --from=builder /app ./
COPY --from=builder /workspace/server/dist ./dist
COPY --from=builder /workspace/server/generated/prisma ./generated/prisma
COPY --from=builder /workspace/server/prisma ./prisma

EXPOSE 8888
CMD ["node", "dist/main.js"]
