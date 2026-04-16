FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

COPY . .

FROM node:18-alpine AS runtime

WORKDIR /app

RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser -H -s /sbin/nologin

COPY --chown=appuser:appuser --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appuser --from=builder /app/src ./src
COPY --chown=appuser:appuser --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]