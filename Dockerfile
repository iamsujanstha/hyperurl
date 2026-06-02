# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Run build command without sourcemap to reduce memory usage
RUN vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs

# Stage 2: Production stage
FROM node:20-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p data

EXPOSE 3000

VOLUME [ "/app/data" ]

CMD ["npm", "run", "start"]
