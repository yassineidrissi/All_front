# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# --- Make ffmpeg available in every stage that uses "base" ---
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# ---------- Build stage ----------
FROM base AS build

# Build deps only needed to compile native modules (if any)
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      node-gyp \
      pkg-config \
      python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# Install deps
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy app source
COPY . .

# ---------- Runtime stage ----------
FROM base AS runner

# Copy the built app (incl. node_modules) from the build stage
COPY --from=build /app /app

# Railway usually sets PORT; your server earlier logged on 8000, not 3000
ENV PORT=8000
EXPOSE 8000

# Start the server (ensure "start" runs node server.js)
CMD ["npm", "run", "start"]
