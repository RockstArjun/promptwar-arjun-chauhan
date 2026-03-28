# Build Stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build || true # Build if you have a build script, otherwise skip

# Production Stage
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 8080
ENV PORT 8080
CMD ["npm", "start"]
