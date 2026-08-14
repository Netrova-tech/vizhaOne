FROM node:22-bookworm-slim AS dependencies

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY backend/package.json backend/package-lock.json ./
COPY backend/src ./src

USER node

EXPOSE 8080

CMD ["node", "src/server.js"]
