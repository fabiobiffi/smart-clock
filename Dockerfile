# syntax=docker/dockerfile:1

# ---- dependencies (shared by test and build) ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- test: typecheck + unit tests + production build ----
FROM deps AS test
COPY . .
CMD ["sh", "-c", "npm run typecheck && npm test && npm run build"]

# ---- frontend build ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- runtime: dependency-free Node server (static files + monitor + weather) ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app
COPY package.json ./
COPY shared ./shared
COPY server ./server
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/ping >/dev/null || exit 1
CMD ["node", "server/index.ts"]
