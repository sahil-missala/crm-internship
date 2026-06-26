# Stage 1: Build React Application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Set dynamic API URL argument (defaults to local docker backend host port)
ARG VITE_API_URL=http://localhost:5050/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve compiled files using Nginx
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
