# Multi-stage Dockerfile for PaisaMind Backend Server
# Stage 1: Build & Dependencies
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# Stage 2: Runtime Image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
