import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for the movement data
  socket.on('card-moved', (data) => {
    socket.broadcast.emit('board-updated', data);
      console.log(`Card moved: ${JSON.stringify(data)}`);
      // Broadcast the movement data to all other connected clients
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(3001, () => {
  console.log('Backend server running on http://localhost:3001');
});