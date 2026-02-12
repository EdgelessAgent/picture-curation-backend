FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p data/uploads data/approvals data/style-feedback

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
