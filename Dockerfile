# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY prisma ./prisma/

RUN yarn install --immutable

COPY . .

RUN yarn prisma:generate
RUN yarn build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY prisma ./prisma/

RUN yarn workspaces focus --all --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Копировать шаблоны (они не компилируются TypeScript)
COPY --from=builder /app/src/mail/templates ./dist/mail/templates

RUN mkdir -p uploads && chmod -R 777 uploads

EXPOSE 3000

CMD ["node", "dist/main"]
