# --- Dev target (hot reload) ---
FROM node:22-alpine AS dev

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

EXPOSE 5173
CMD ["pnpm", "dev", "--host"]

# --- Prod target ---
FROM node:22-alpine AS prod

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 5173
CMD ["pnpm", "preview", "--host"]
