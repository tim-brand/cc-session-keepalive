FROM oven/bun:1 AS base

WORKDIR /app

# Install Node.js for Claude Code CLI (npm package)
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Create Claude config directory and set up for headless operation
RUN mkdir -p /root/.claude && \
    echo '{"hasCompletedOnboarding": true}' > /root/.claude.json

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
# Default: 4 hours
ENV PROMPT_INTERVAL_MS=14400000

# Run the service
CMD ["bun", "run", "src/index.ts"]
