FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN corepack pnpm install --frozen-lockfile=false
RUN corepack pnpm --filter @codemuscle/web build
CMD ["corepack","pnpm","--filter","@codemuscle/web","start"]
