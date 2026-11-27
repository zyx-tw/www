# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
# bun installs; node runs `next build` itself.
COPY --from=oven/bun:1.4.5-alpine /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ENV NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1
# The GitHub token (optional) lets the prerendered Info carry the heatmap.
RUN --mount=type=secret,id=github_token,env=GITHUB_TOKEN \
    bun run build && rm -rf .next/cache && mkdir -p public

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_NO_WARNINGS=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
