FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
# Install system dependencies
RUN apk add --no-cache openssl
# Ensure we have all dependencies including dev for building
RUN npm install

# Copy source and prisma
COPY prisma ./prisma/
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Generate Prisma Client in production
RUN npx prisma generate

# Start the application
CMD ["npm", "start"]
