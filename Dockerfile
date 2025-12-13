# Stage 1: Build the Vite application
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files and lockfile
COPY package.json bun.lock ./

# Install dependencies using bun (faster than npm)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments for Vite (must be passed from Railway at build time)
ARG VITE_CONVEX_URL
ARG VITE_CLERK_PUBLISHABLE_KEY

# Set as environment variables for Vite build
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Build the application (outputs to dist/ folder)
RUN bun run build

# Stage 2: Serve static files with Caddy
FROM caddy:alpine AS runner

WORKDIR /app

# Copy Caddyfile configuration
COPY Caddyfile ./

# Format and validate Caddyfile
RUN caddy fmt Caddyfile --overwrite

# Copy built static files from builder stage
COPY --from=builder /app/dist ./dist

# Caddy will serve files from dist/ directory
# Railway automatically provides PORT environment variable
CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]
