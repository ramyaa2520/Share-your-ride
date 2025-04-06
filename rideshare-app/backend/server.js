const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://rideshare-frontend.vercel.app', 'https://rideshare-app.vercel.app', 'https://shareride-ten.vercel.app'] 
    : 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://Riddeshare:Riddeshare@rideshare.c8ijbtr.mongodb.net/?retryWrites=true&w=majority&appName=rideshare';

// Connection to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Run migration to remove unique index on phoneNumber to fix registration issues
    try {
      console.log('Running migration to fix phoneNumber index...');
      const userCollection = conn.connection.db.collection('users');
      
      // First, check if the index exists
      const indexes = await userCollection.indexes();
      const phoneIndex = indexes.find(index => 
        index.key && index.key.phoneNumber === 1 && index.unique === true
      );
      
      if (phoneIndex) {
        console.log('Found problematic phoneNumber index, dropping it...');
        await userCollection.dropIndex('phoneNumber_1');
        console.log('Successfully dropped phoneNumber index');
      } else {
        console.log('No problematic phoneNumber index found, no action needed');
      }
    } catch (migrationError) {
      console.error('Error in migration:', migrationError);
      // Continue with server startup even if migration fails
    }
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const rideRoutes = require('./routes/rides');
const driverRoutes = require('./routes/drivers');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('RideShare API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

// Start server
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

module.exports = app; 
