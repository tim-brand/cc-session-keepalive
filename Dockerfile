FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Final image
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Expose the HTTP port
EXPOSE 3000

# Set environment defaults
ENV PORT=3000
# Default: 1 hour
ENV PROMPT_INTERVAL_MS=3600000

# Run the service
CMD ["bun", "run", "src/index.ts"]
