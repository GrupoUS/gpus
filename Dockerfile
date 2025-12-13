# Base stage for building
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
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
# CRITICAL: Bind to 0.0.0.0 to be accessible outside the container
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV VINXI_HOST=0.0.0.0

# Copy necessary files from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start"]
