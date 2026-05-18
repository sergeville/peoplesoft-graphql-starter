FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY data ./data
COPY scripts ./scripts

EXPOSE 4000 4100

# Default: GraphQL BFF. Override CMD for mock-ps service.
CMD ["npx", "tsx", "src/server.ts"]
