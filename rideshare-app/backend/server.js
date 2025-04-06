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
  origin: [
    'https://shareride-ten.vercel.app',
    'http://localhost:3000',
    'https://share-your-ride-git-master-ramyaas-projects.vercel.app',
    'https://share-your-ride-orcin.vercel.app',
    'https://share-your-ride.vercel.app'
  ],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Add explicit OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://Riddeshare:Riddeshare@rideshare.c8ijbtr.mongodb.net/rideshareDB?retryWrites=true&w=majority&appName=rideshare';

// Connection to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
      socketTimeoutMS: 45000, // 45 seconds timeout for socket operations
      family: 4 // Force IPv4
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    // Run migrations to fix any index issues
    try {
      console.log('Setting up MongoDB indexes...');
      const userCollection = conn.connection.db.collection('users');
      
      // Get existing indexes for diagnostics
      const indexes = await userCollection.indexes();
      console.log('Current indexes:', JSON.stringify(indexes, null, 2));
      
      // Clean up any problematic indexes
      // NOTE: The error shows 'phone_number' but model uses 'phoneNumber'
      // Check for both versions of phone number indexes
      for (const index of indexes) {
        // Check for any phone-related index with uniqueness
        if ((index.key && (index.key.phoneNumber === 1 || index.key.phone_number === 1)) && index.unique === true) {
          console.log(`Found problematic phone number index: ${index.name}, dropping it...`);
          try {
            await userCollection.dropIndex(index.name);
            console.log(`Successfully dropped phone number index: ${index.name}`);
          } catch (indexError) {
            console.error(`Error dropping index ${index.name}:`, indexError);
          }
        }
      }

      // 2. Find email indexes
      const emailIndexes = indexes.filter(index => 
        index.key && (index.key.email === 1) && index.name !== '_id_'
      );
      
      // 3. Set up proper email index (drop any existing ones first)
      if (emailIndexes.length > 0) {
        console.log(`Found ${emailIndexes.length} email indexes. Recreating for consistency...`);
        
        for (const index of emailIndexes) {
          try {
            console.log(`Dropping email index: ${index.name}`);
            await userCollection.dropIndex(index.name);
          } catch (error) {
            console.log(`Error dropping index (may be harmless): ${error.message}`);
          }
        }
      }
      
      // Create a single case-insensitive email index
      await userCollection.createIndex(
        { email: 1 }, 
        { 
          unique: true, 
          collation: { locale: 'en', strength: 2 }, // Case-insensitive
          background: true,
          name: 'email_unique_ci'
        }
      );
      console.log('Email index created/updated successfully');
      
      // Verify final indexes
      const finalIndexes = await userCollection.indexes();
      console.log('Final indexes configuration:', JSON.stringify(finalIndexes, null, 2));
      
    } catch (migrationError) {
      console.error('Error in database migration:', migrationError);
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

// Set headers for all responses to handle CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', corsOptions.origin.includes(req.headers.origin) ? req.headers.origin : corsOptions.origin[0]);
  res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
  res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('RideShare API is running');
});

// Database health check route
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Get some stats about the database
    let userCount = 0;
    try {
      userCount = await mongoose.connection.db.collection('users').countDocuments();
    } catch (err) {
      console.error('Error counting users:', err);
    }
    
    res.json({
      status: 'success',
      db: {
        state: dbStatus[dbState],
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        userCount
      },
      api: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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
