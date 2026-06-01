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

// 1. Hardcode the baseline data on the server so it can act as the single source of truth
let currentBoardData = {
  tasks: {
    'task-1': { id: 'task-1', content: 'Set up Vite frontend architecture' },
    'task-2': { id: 'task-2', content: 'Configure Node.js WS server handles' },
    'task-3': { id: 'task-3', content: 'Implement real-time sync mechanism' },
  },
  columns: {
    'column-todo': { id: 'column-todo', title: 'To Do', taskIds: ['task-1', 'task-2'] },
    'column-in-progress': { id: 'column-in-progress', title: 'In Progress', taskIds: ['task-3'] },
    'column-done': { id: 'column-done', title: 'Done', taskIds: [] },
  },
  columnOrder: ['column-todo', 'column-in-progress', 'column-done'],
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 2. As soon as a browser connects, instantly send them the latest saved board state
  socket.emit('initial-board-state', currentBoardData);

  socket.on('card-moved', (data) => {
    // 3. Update our server's master copy whenever a card moves
    currentBoardData = data; 
    
    socket.broadcast.emit('board-updated', data);
    console.log(`Card moved & state updated on server.`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(3001, () => {
  console.log('Backend server running on http://localhost:3001');
});