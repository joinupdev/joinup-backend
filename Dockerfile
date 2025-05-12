# ---- Base Node image ----
FROM node:22 AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Build ----
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
# Ensure Prisma client is generated before building
RUN npx prisma generate
RUN npm run build

# ---- Production ----
FROM base AS prod
ENV NODE_ENV=production
# Security: use non-root user
RUN useradd --user-group --create-home --shell /bin/false appuser
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma
RUN mkdir -p /app/logs && chown -R appuser:appuser /app
USER appuser
EXPOSE 3000
CMD ["node", "dist/server.js"]