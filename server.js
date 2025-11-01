const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const path = require("path");
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://nightshades257:SDb3O4aHBkVxF1Rx@cluster0.4pqhdrv.mongodb.net/khetsathi?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

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
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test authentication endpoint
app.get('/api/test-auth', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Authentication working', 
    user: req.user 
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

// Change password
app.put('/api/user/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password
    const passwordRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{5,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one lowercase letter, one number, one symbol, and be at least 5 characters long' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
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

// Quiz routes

// Get quiz questions
app.get('/api/quiz/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    // Sample questions based on type
    const quizQuestions = {
      sustainable: [
        {
          question: "What is the primary goal of sustainable agriculture?",
          options: [
            "Maximizing crop yield at any cost",
            "Balancing environmental health, economic profitability, and social equity",
            "Using only organic methods regardless of effectiveness",
            "Eliminating all pesticide use"
          ],
          correct: 1
        },
        {
          question: "Which practice helps improve soil health?",
          options: [
            "Monocropping",
            "Crop rotation",
            "Excessive tilling",
            "Using synthetic fertilizers only"
          ],
          correct: 1
        }
      ],
      water: [
        {
          question: "What is the most efficient irrigation method?",
          options: [
            "Flood irrigation",
            "Sprinkler irrigation",
            "Drip irrigation",
            "Furrow irrigation"
          ],
          correct: 2
        }
      ],
      waste: [
        {
          question: "How can agricultural waste be managed sustainably?",
          options: [
            "Burning in open fields",
            "Landfilling",
            "Composting and recycling",
            "Dumping in water bodies"
          ],
          correct: 2
        }
      ]
    };
    
    const questions = quizQuestions[type] || [];
    res.json({ questions, title: `${type.charAt(0).toUpperCase() + type.slice(1)} Farming Quiz` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit quiz results
app.post('/api/quiz/submit', authenticateToken, async (req, res) => {
  try {
    const { quizType, score, correctAnswers, totalQuestions } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Calculate points earned (5 points per 10% score)
    const pointsEarned = Math.round(score / 10) * 5;
    
    // Update user's GreenPoints
    user.greenPoints += pointsEarned;
    
    await user.save();
    
    res.json({
      message: 'Quiz submitted successfully',
      pointsEarned,
      totalGreenPoints: user.greenPoints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's quiz statistics
app.get('/api/quiz/stats', authenticateToken, async (req, res) => {
  try {
    const userStats = {
      quizzesTaken: 5,
      averageScore: 78,
      pointsEarned: 195,
      correctAnswers: 39,
      totalQuestions: 50
    };
    
    res.json(userStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Purchase routes

// Create equipment rental
app.post('/api/purchases/equipment', authenticateToken, async (req, res) => {
  try {
    const { equipmentId, duration, totalAmount } = req.body;
    
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Create rental record
    const rental = {
      userId: req.user.userId,
      equipmentId,
      equipmentName: equipment.name,
      duration,
      totalAmount,
      rentalDate: new Date(),
      status: 'active'
    };
    
    // Update equipment availability if needed
    equipment.isAvailable = false;
    await equipment.save();
    
    res.status(201).json({
      message: 'Equipment rented successfully',
      rental
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create byproduct purchase
app.post('/api/purchases/byproduct', authenticateToken, async (req, res) => {
  try {
    const { byproductId, quantity, totalAmount } = req.body;
    
    const byproduct = await ByProduct.findById(byproductId);
    if (!byproduct) {
      return res.status(404).json({ message: 'ByProduct not found' });
    }
    
    // Create purchase record
    const purchase = {
      userId: req.user.userId,
      byproductId,
      byproductName: byproduct.name,
      quantity,
      totalAmount,
      purchaseDate: new Date(),
      status: 'completed'
    };
    
    // Update byproduct availability if needed
    byproduct.isAvailable = false;
    await byproduct.save();
    
    res.status(201).json({
      message: 'ByProduct purchased successfully',
      purchase
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's purchases
app.get('/api/purchases', authenticateToken, async (req, res) => {
  try {
    const equipmentPurchases = [];
    const byproductPurchases = [];
    
    res.json({
      equipmentPurchases,
      byproductPurchases
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Community routes

// Get chat channels
app.get('/api/community/channels', authenticateToken, async (req, res) => {
  try {
    const channels = [
      {
        id: 'general',
        name: 'General Discussion',
        description: 'Talk about anything related to farming',
        icon: 'fas fa-comments',
        members: 42
      },
      {
        id: 'equipment',
        name: 'Equipment Sharing',
        description: 'Discuss equipment rental and sharing',
        icon: 'fas fa-tractor',
        members: 28
      },
      {
        id: 'byproducts',
        name: 'ByProducts Market',
        description: 'Buy and sell agricultural byproducts',
        icon: 'fas fa-seedling',
        members: 35
      }
    ];
    
    res.json(channels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get channel messages
app.get('/api/community/channels/:channelId/messages', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const messages = [];
    
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
app.post('/api/community/channels/:channelId/messages', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { text } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const message = {
      id: Date.now().toString(),
      sender: user.username,
      senderId: user._id,
      text,
      channelId,
      timestamp: new Date()
    };
    
    res.status(201).json({
      message: 'Message sent successfully',
      message: message
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Chatbot API endpoint
app.post('/api/chatbot', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    // Simple rule-based responses
    const responses = {
      'hello': 'Hello! How can I help you with your farming needs today?',
      'hi': 'Hi there! I\'m your farming assistant. What can I help you with?',
      'equipment': 'You can rent farming equipment from other farmers in your area. Check the Equipment section to browse available tools.',
      'byproduct': 'You can buy and sell agricultural byproducts in the ByProducts section. It\'s a great way to reduce waste and earn extra income!',
      'greenpoints': 'GreenPoints are earned by participating in sustainable activities like renting equipment, selling byproducts, and taking educational quizzes.',
      'sustainable': 'Sustainable farming practices include crop rotation, water conservation, organic fertilization, and integrated pest management.',
      'rent': 'To rent equipment, go to the Equipment section, find what you need, and contact the owner directly through the app.',
      'sell': 'To sell byproducts, go to the ByProducts section and click "Add New Listing" to create your listing.',
      'default': 'I\'m here to help with farming equipment rental, byproduct trading, and sustainable farming advice. What would you like to know more about?'
    };
    
    const lowerMessage = message.toLowerCase().trim();
    let response = responses.default;
    
    // Find matching response
    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key) || key === lowerMessage) {
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

// GreenPoints and badges routes

// Get user's GreenPoints and badges
app.get('/api/greenpoints', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const equipmentListings = await Equipment.find({ ownerId: req.user.userId });
    const byproductListings = await ByProduct.find({ ownerId: req.user.userId });
    
    // Calculate points
    const quizPoints = user.greenPoints || 0;
    const sellingPoints = byproductListings.length * 15;
    const rentingPoints = equipmentListings.length * 10;
    
    const totalPoints = quizPoints + sellingPoints + rentingPoints;

    const userBadges = await Badge.find({ userId: req.user.userId });

    res.json({
      totalPoints,
      breakdown: {
        quiz: quizPoints,
        selling: sellingPoints,
        renting: rentingPoints
      },
      stats: {
        quizzesTaken: user.quizzesTaken || 0,
        byproductsSold: byproductListings.length,
        equipmentRented: equipmentListings.length
      },
      badges: userBadges
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Award badge to user
app.post('/api/greenpoints/badges', authenticateToken, async (req, res) => {
  try {
    const { badgeId } = req.body;
    
    // Check if user already has the badge
    const existingBadge = await Badge.findOne({ 
      userId: req.user.userId, 
      badgeId 
    });
    
    if (existingBadge) {
      return res.status(400).json({ message: 'Badge already earned' });
    }

    // Create new badge
    const newBadge = new Badge({
      userId: req.user.userId,
      badgeId,
      earnedAt: new Date()
    });

    await newBadge.save();

    res.status(201).json({
      message: 'Badge awarded successfully',
      badge: newBadge
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard
app.get('/api/greenpoints/leaderboard', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('username greenPoints');
    
    const leaderboard = await Promise.all(users.map(async (user) => {
      const equipmentListings = await Equipment.find({ ownerId: user._id });
      const byproductListings = await ByProduct.find({ ownerId: user._id });
      
      const sellingPoints = byproductListings.length * 15;
      const rentingPoints = equipmentListings.length * 10;
      const totalPoints = (user.greenPoints || 0) + sellingPoints + rentingPoints;
      
      return {
        username: user.username,
        points: totalPoints,
        initial: user.username.charAt(0).toUpperCase()
      };
    }));

    // Sort by points (descending)
    leaderboard.sort((a, b) => b.points - a.points);

    res.json(leaderboard.slice(0, 10));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});
