FROM node:24-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY tsconfig.json ./
COPY src ./src

RUN pnpm build

FROM deps AS prod-deps

ENV HUSKY=0

RUN pnpm prune --prod --ignore-scripts

FROM base AS production

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/server.js"]
