FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY mcp-server/package.json ./mcp-server/
RUN npm ci --workspace=mcp-server 2>/dev/null || npm install --workspace=mcp-server
COPY mcp-server ./mcp-server
COPY config ./config
RUN npm run build --workspace=mcp-server

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/mcp-server/package.json ./mcp-server/
COPY --from=build /app/mcp-server/dist ./mcp-server/dist
COPY --from=build /app/mcp-server/node_modules ./mcp-server/node_modules
COPY config ./config
EXPOSE 3100
CMD ["node", "mcp-server/dist/index.js"]
