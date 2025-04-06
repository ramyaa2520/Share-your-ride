FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy backend package.json and package-lock.json
COPY ./rideshare-app/backend/package*.json ./

# Install backend dependencies
RUN npm install --production

# Copy backend files
COPY ./rideshare-app/backend/ ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"] 
