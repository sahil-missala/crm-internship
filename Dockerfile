# --- Stage 1: Build the React Frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Since they run on the same server/port, we can use a relative API path!
ENV VITE_API_URL=/api
RUN npm run build

# --- Stage 2: Package the Node.js Backend & Assets ---
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
# Copy compiled frontend static assets from Stage 1 into the backend's 'public' folder
COPY --from=frontend-build /frontend/dist ./public

EXPOSE 5050
CMD ["node", "server.js"]
