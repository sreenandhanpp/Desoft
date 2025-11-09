// Importing modules
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const connectDB = require('./MongoDb/connect.js');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes.js');
const uploadRoutes = require('./routes/uploadRoutes.js');
const authRoutes = require('./routes/auth.routes.js');
const Product = require('./MongoDb/models/Product.js');

// Compile .env file
dotenv.config();

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/CashBook';
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// Initialize express and http server
const app = express();
const server = createServer(app);

// ✅ Improved CORS setup
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Socket.io setup ✅ using same CORS rules
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io available globally
app.set('io', io);

// Socket.io events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start Server Function
const StartServer = async () => {
  try {
    await connectDB(MONGODB_URL);
    console.log('✅ MongoDB Connected Successfully');

    try {
      await Product.collection.dropIndex('productId_1');
      console.log('Dropped old productId index');
    } catch (error) {
      if (error.code === 27) {
        console.log('productId index does not exist, skipping...');
      } else {
        console.log('Error dropping index:', error.message);
      }
    }

    server.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
  }
};

console.log('MongoDB URL:', MONGODB_URL);

// Start server
StartServer();
