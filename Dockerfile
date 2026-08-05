# ---- build stage: compile the React frontend ----
FROM node:20-bookworm-slim AS build
WORKDIR /app

# npm ci here installs all deps, including the native better-sqlite3;
# the toolchain is a fallback if its prebuilt binary cannot be downloaded.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage: Express API server + static frontend ----
FROM node:20-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app

# Toolchain fallback in case better-sqlite3 has no prebuilt binary
# for this platform (it downloads one by default and skips compilation).
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server

ENV PORT=3000
EXPOSE 3000
VOLUME /app/data

CMD ["node", "server/index.js"]
