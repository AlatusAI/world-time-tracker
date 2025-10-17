# Stage 1: Build frontend
FROM node:20 AS builder
WORKDIR /app

# Copy backend and frontend
COPY backend ./backend
COPY package*.json ./

# Install backend deps
WORKDIR /app/backend
RUN npm install

# Install frontend deps and build
WORKDIR /app/backend/client
RUN npm install && npm run build

# Stage 2: Run backend + serve frontend
FROM node:20 AS runner
WORKDIR /app

# Copy backend only
COPY --from=builder /app/backend ./backend

# Install only production deps
WORKDIR /app/backend
RUN npm install --omit=dev

# Expose backend port
EXPOSE 5000

# Start backend (which serves frontend dist)
CMD ["npm", "start"]
