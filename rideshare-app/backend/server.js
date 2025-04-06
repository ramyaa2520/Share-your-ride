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
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://rideshare-frontend.vercel.app', 
      'https://rideshare-app.vercel.app', 
      'https://shareride-ten.vercel.app'
    ];
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in development
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
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
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Run migrations to fix any index issues
    try {
      console.log('Running database migrations...');
      const userCollection = conn.connection.db.collection('users');
      
      // Get existing indexes for diagnostics
      const indexes = await userCollection.indexes();
      console.log('Current indexes:', JSON.stringify(indexes, null, 2));
      
      // First, check if the phoneNumber index exists and remove it if it's causing problems
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
      
      // IMPORTANT: Fix email uniqueness indexes
      console.log('Fixing email uniqueness indexes...');
      
      // First, drop ALL existing email indexes to ensure clean state
      const emailIndexes = indexes.filter(index => 
        index.key && index.key.email && index.name !== '_id_'
      );
      
      console.log(`Found ${emailIndexes.length} email indexes`);
      
      // Drop all existing email indexes to avoid conflicts
      if (emailIndexes.length > 0) {
        console.log('Dropping existing email indexes to recreate with proper settings...');
        
        for (const index of emailIndexes) {
          try {
            console.log(`Dropping email index: ${index.name}`);
            await userCollection.dropIndex(index.name);
            console.log(`Successfully dropped email index: ${index.name}`);
          } catch (indexError) {
            console.error(`Error dropping index ${index.name}:`, indexError);
          }
        }
      }
      
      // Create a new, proper case-insensitive unique email index
      try {
        console.log('Creating case-insensitive email index...');
        await userCollection.createIndex(
          { email: 1 }, 
          { 
            unique: true, 
            collation: { locale: 'en', strength: 2 }, // Case-insensitive
            background: true,
            name: 'email_unique_ci'
          }
        );
        console.log('Email index created successfully');
        
        // Check for duplicate emails that might cause issues
        const duplicateEmails = await userCollection.aggregate([
          { $group: { _id: { email: { $toLower: "$email" } }, count: { $sum: 1 }, ids: { $push: "$_id" } } },
          { $match: { count: { $gt: 1 } } }
        ]).toArray();
        
        if (duplicateEmails.length > 0) {
          console.warn('WARNING: Found duplicate emails (case-insensitive) that may cause issues:');
          duplicateEmails.forEach(dup => {
            console.warn(`  Email: ${dup._id.email}, Count: ${dup.count}, IDs: ${dup.ids.join(', ')}`);
          });
        } else {
          console.log('No duplicate emails found. Email uniqueness should work correctly.');
        }
        
        // Verify the index was created properly
        const updatedIndexes = await userCollection.indexes();
        const newEmailIndex = updatedIndexes.find(index => index.name === 'email_unique_ci');
        
        if (newEmailIndex) {
          console.log('Email index verified:', JSON.stringify(newEmailIndex, null, 2));
        } else {
          console.error('Email index creation was not verified! Check database manually.');
        }
      } catch (indexCreateError) {
        console.error('Error creating email index:', indexCreateError);
        
        // If we can't create the index because of duplicate values, we need to handle this
        if (indexCreateError.code === 11000) {
          console.error('Duplicate email values detected in the database. Index cannot be created.');
          console.error('Please clean up duplicate email entries manually before running again.');
        }
      }
      
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
