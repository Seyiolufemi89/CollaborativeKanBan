import 'dotenv/config'; // Loads environmental variables from your .env file on startup
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

// ==========================================
// 1. DATABASE CONNECTION & CONFIGURATION
// ==========================================
// REPLACE THIS STRING with your actual connection string from MongoDB Atlas!
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Successfully connected to MongoDB Atlas durable layer.'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ==========================================
// 2. MONGOOSE SCHEMA DEFINITIONS
// ==========================================
// We define a single unified Board schema to preserve our atomic Kanban layout structure
const BoardSchema = new mongoose.Schema({
  boardId: { type: String, default: "default-master-board", unique: true },
  tasks: { type: Map, of: new mongoose.Schema({ id: String, content: String }, { _id: false }) },
  columns: {
    type: Map,
    of: new mongoose.Schema({
      id: String,
      title: String,
      taskIds: [String]
    }, { _id: false })
  },
  columnOrder: [String]
}, { timestamps: true });

const Board = mongoose.model('Board', BoardSchema);

// Fallback seed data if the database is completely empty on initial startup
const initialSeedData = {
  boardId: "default-master-board",
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

// ==========================================
// 3. REAL-TIME EVENT PIPELINES
// ==========================================
io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.id}`);

  try {
    // Attempt to query the master board layout from MongoDB
    let board = await Board.findOne({ boardId: "default-master-board" });
    
    // If it's a fresh database instance, seed the initial data document immediately
    if (!board) {
      board = await Board.create(initialSeedData);
      console.log('🌱 Database was empty. Seeded baseline document collections.');
    }

    // Serve the persistent database state to the newly connected browser instantly
    socket.emit('initial-board-state', board);

  } catch (error) {
    console.error('Error fetching initial state from MongoDB:', error);
  }

  // Handle live drag-and-drop actions
  socket.on('card-moved', async (updatedBoardData) => {
    try {
      // Broadcast the visual movement to all secondary clients immediately for zero UI latency
      socket.broadcast.emit('board-updated', updatedBoardData);

      // Persist the updated configuration asynchronously to MongoDB
      await Board.findOneAndUpdate(
        { boardId: "default-master-board" },
        { 
          $set: {
            tasks: updatedBoardData.tasks,
            columns: updatedBoardData.columns,
            columnOrder: updatedBoardData.columnOrder
          }
        },
        { new: true, upsert: true }
      );
      
      console.log(`💾 State safely persisted to MongoDB document store.`);
    } catch (error) {
      console.error('Async Database Write Transaction Failed:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(3001, () => {
  console.log('Backend server running on http://localhost:3001');
});