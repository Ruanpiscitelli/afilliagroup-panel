# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Define build argument for API URL
# Use direct Railway URL for production (nginx proxy doesn't work with separate Railway services)
ARG VITE_API_URL=https://server-production-c320.up.railway.app/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Serve Stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
