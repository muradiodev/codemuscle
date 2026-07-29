FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN corepack pnpm install --frozen-lockfile=false
RUN corepack pnpm --filter @codemuscle/api exec prisma generate
RUN corepack pnpm --filter @codemuscle/api build
CMD ["node","apps/api/dist/server.js"]
