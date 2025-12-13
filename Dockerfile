# Base stage for building
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
# Note: We use npm install because we want to use the standard node image.
# If you strictly prefer bun, we can switch to oven/bun, but 'start' script uses 'node'.
COPY package.json ./

# Install dependencies (ignoring scripts to speed up)
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install serve globally to serve static files
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 3000

# Start the server
CMD ["serve", "-s", "dist", "-l", "3000"]
