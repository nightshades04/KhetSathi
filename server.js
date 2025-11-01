const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000', 'https://khettsathhl.onxender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// MongoDB connection with better error handling
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://nightshades257:SDb3O4aHBkVxF1Rx@cluster0.4pqhdrv.mongodb.net/khetsathi?retryWrites=true&w=majority&appName=Cluster0';

console.log('Attempting to connect to MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.log('❌ MongoDB connection error:', err.message);
  console.log('🔧 To fix this:');
  console.log('1. Go to MongoDB Atlas → Network Access');
  console.log('2. Click "Add IP Address"');
  console.log('3. Add "0.0.0.0/0" to allow all IP addresses');
  console.log('4. Or add Render.com IP ranges');
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  mobile: { type: String, default: '' },
  theme: { type: String, default: 'light' },
  greenPoints: { type: Number, default: 0 },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  createdAt: { type: Date, default: Date.now }
});

// Equipment Schema
const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  image: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// ByProduct Schema
const byproductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: String, required: true },
  location: { type: String, required: true },
  image: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Badge Schema
const badgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Equipment = mongoose.model('Equipment', equipmentSchema);
const ByProduct = mongoose.model('ByProduct', byproductSchema);
const Badge = mongoose.model('Badge', badgeSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-12345';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbStatus,
    message: 'KhetSathi API Server is running',
    version: '1.0.0'
  });
});

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.json({ 
    message: '🚜 KhetSathi Farming Platform API',
    description: 'Equipment rental and byproduct trading platform for farmers',
    version: '1.0.0',
    endpoints: {
      auth: {
        signup: 'POST /api/signup',
        login: 'POST /api/login',
        profile: 'GET /api/user'
      },
      equipment: {
        list: 'GET /api/equipment',
        add: 'POST /api/equipment',
        my_listings: 'GET /api/my-equipment'
      },
      byproducts: {
        list: 'GET /api/byproducts',
        add: 'POST /api/byproducts',
        my_listings: 'GET /api/my-byproducts'
      },
      health: 'GET /api/health'
    },
    documentation: 'All endpoints except /api/health require Authorization header with Bearer token'
  });
});

// User registration
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{5,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one lowercase letter, one number, one symbol, and be at least 5 characters long' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      location
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        location: newUser.location
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ email: username }, { username }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        location: user.location,
        mobile: user.mobile,
        theme: user.theme,
        greenPoints: user.greenPoints
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
app.put('/api/user', authenticateToken, async (req, res) => {
  try {
    const { username, mobile, theme } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (mobile) updateData.mobile = mobile;
    if (theme) updateData.theme = theme;

    // Check if username is being updated and if it's already taken
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user.userId } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Equipment routes

// Get all equipment (excluding user's own)
app.get('/api/equipment', authenticateToken, async (req, res) => {
  try {
    const equipment = await Equipment.find({ 
      ownerId: { $ne: req.user.userId },
      isAvailable: true
    }).sort({ createdAt: -1 });
    res.json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new equipment
app.post('/api/equipment', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, location, image } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newEquipment = new Equipment({
      name,
      description,
      price,
      location,
      image,
      ownerId: req.user.userId,
      ownerName: user.username
    });

    await newEquipment.save();

    // Add GreenPoints for listing equipment
    user.greenPoints += 10;
    await user.save();

    res.status(201).json({
      message: 'Equipment listed successfully',
      equipment: newEquipment,
      greenPoints: user.greenPoints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's equipment listings
app.get('/api/my-equipment', authenticateToken, async (req, res) => {
  try {
    const equipment = await Equipment.find({ ownerId: req.user.userId }).sort({ createdAt: -1 });
    res.json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete equipment listing
app.delete('/api/equipment/:id', authenticateToken, async (req, res) => {
  try {
    const equipment = await Equipment.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.userId 
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Equipment listing deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ByProduct routes

// Get all byproducts (excluding user's own)
app.get('/api/byproducts', authenticateToken, async (req, res) => {
  try {
    const byproducts = await ByProduct.find({ 
      ownerId: { $ne: req.user.userId },
      isAvailable: true
    }).sort({ createdAt: -1 });
    res.json(byproducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new byproduct
app.post('/api/byproducts', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, quantity, location, image } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newByProduct = new ByProduct({
      name,
      description,
      price,
      quantity,
      location,
      image,
      ownerId: req.user.userId,
      ownerName: user.username
    });

    await newByProduct.save();

    // Add GreenPoints for listing byproduct
    user.greenPoints += 15;
    await user.save();

    res.status(201).json({
      message: 'ByProduct listed successfully',
      byproduct: newByProduct,
      greenPoints: user.greenPoints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's byproduct listings
app.get('/api/my-byproducts', authenticateToken, async (req, res) => {
  try {
    const byproducts = await ByProduct.find({ ownerId: req.user.userId }).sort({ createdAt: -1 });
    res.json(byproducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete byproduct listing
app.delete('/api/byproducts/:id', authenticateToken, async (req, res) => {
  try {
    const byproduct = await ByProduct.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.userId 
    });

    if (!byproduct) {
      return res.status(404).json({ message: 'ByProduct not found' });
    }

    await ByProduct.findByIdAndDelete(req.params.id);
    res.json({ message: 'ByProduct listing deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Chatbot API endpoint
app.post('/api/chatbot', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    const responses = {
      'hello': 'Hello! How can I help you with your farming needs today?',
      'hi': 'Hi there! I\'m your farming assistant. What can I help you with?',
      'equipment': 'You can rent farming equipment from other farmers in your area. Check the Equipment section to browse available tools.',
      'byproduct': 'You can buy and sell agricultural byproducts in the ByProducts section.',
      'greenpoints': 'GreenPoints are earned by participating in sustainable activities.',
      'default': 'I\'m here to help with farming equipment rental and byproduct trading.'
    };
    
    const lowerMessage = message.toLowerCase().trim();
    let response = responses.default;
    
    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }
    
    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: https://khettsathhl.onxender.com/api/health`);
  console.log(`📚 API Docs: https://khettsathhl.onxender.com/`);
});
