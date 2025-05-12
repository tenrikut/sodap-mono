# Use Node.js 20 with Debian (better compatibility than Alpine)
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies required for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libudev-dev \
    libusb-1.0-0-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with legacy peer deps flag to avoid issues
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the port
EXPOSE 3000

# Start the application in development mode to avoid build issues
CMD ["npm", "run", "dev"]