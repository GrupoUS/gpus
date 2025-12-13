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

# Copy necessary files from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start"]
