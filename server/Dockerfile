FROM node:20-alpine
WORKDIR /app

# Install deps first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev && npm install tsx

# Copy source files needed by the server
# (src/engine + src/coaching + src/types + src/lib/metrics are pure TS, no React Native runtime)
COPY tsconfig.json ./
COPY src/engine/coaching.ts         ./src/engine/coaching.ts
COPY src/engine/recovery.ts         ./src/engine/recovery.ts
COPY src/coaching/                  ./src/coaching/
COPY src/types/                     ./src/types/
COPY src/lib/metrics.ts             ./src/lib/metrics.ts
COPY server/index.ts                ./server/index.ts

EXPOSE 8787
ENV NODE_ENV=production
CMD ["npx", "tsx", "server/index.ts"]
