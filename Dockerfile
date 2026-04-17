FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

FROM node:20-alpine AS production

LABEL maintainer="equipo-desarrollo" \
      version="1.0.0" \
      description="API REST Node.js/Express.js - Proyecto XP-9"

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --omit=dev

COPY --from=builder /app/src ./src

RUN addgroup -S nodegroup && \
    adduser -S nodeuser -G nodegroup && \
    chown -R nodeuser:nodegroup /app

USER nodeuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "src/index.js"]