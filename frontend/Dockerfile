FROM node:22-alpine AS builder

WORKDIR /app

ARG GRAPHQL_INTERNAL_URL=http://backend:4000/
ENV GRAPHQL_INTERNAL_URL=$GRAPHQL_INTERNAL_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY next.config.ts ./

EXPOSE 3000

CMD ["npm", "run", "start"]
