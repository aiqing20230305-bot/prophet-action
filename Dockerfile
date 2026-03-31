# Multi-stage build for smaller image size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Production image
FROM node:20-alpine

WORKDIR /app

# Install git (needed for .prophet/ commits)
RUN apk add --no-cache git

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set environment
ENV NODE_ENV=production

# Entry point
CMD ["node", "prophet-micro-tasks.cjs"]
