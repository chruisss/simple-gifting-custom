# syntax=docker/dockerfile:1

# 1. Base image for installing dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package.json and lock file and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# 2. Base image for building the application
FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .

# Generate Prisma client and build the app
RUN npm run generate
RUN npm run build

# 3. Final, production-ready image
FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy built app and production dependencies
COPY --from=build /app/build /app/build
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/
COPY --from=build /app/prisma /app/prisma

# The port should be set by the hosting provider
# EXPOSE 3000

# The start command should be configured in the hosting provider (e.g., fly.toml)
# CMD ["npm", "run", "start"]
CMD ["npm", "run", "docker-start"]
