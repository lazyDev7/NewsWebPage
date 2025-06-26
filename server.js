const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const cors = require('cors');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB Atlas Connection
mongoose.connect('mongodb+srv://RAHULMAITY:Rm862003%40@username-password.bznis9q.mongodb.net/news_project?retryWrites=true&w=majority&appName=username-password')
  .then(() => {
    console.log('Connected to MongoDB Atlas!');
    
    // Verify connection and collections
    console.log('Database name:', mongoose.connection.db.databaseName);
    mongoose.connection.db.listCollections().toArray((err, names) => {
      if (err) {
        console.error('Error listing collections:', err);
        return;
      }
      console.log('Collections:', names.map(c => c.name));
    });
  })
  .catch(err => console.error('Atlas connection error:', err));

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  searchHistory: [{
    query: String,
    date: { type: Date, default: Date.now }
  }],
});

const User = mongoose.model('User', userSchema);

// Create unique index for username
User.collection.createIndex({ username: 1 }, { unique: true })
  .then(() => console.log('Username index created'))
  .catch(err => console.log('Index already exists'));

// Routes
app.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username and password are required' 
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('User already exists:', username);
      return res.status(400).json({ 
        success: false,
        error: 'Username already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      password: hashedPassword,
      searchHistory: [] 
    });
    
    const savedUser = await user.save();
    console.log('New user registered:', savedUser.username);
    
    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: {
        id: savedUser._id,
        username: savedUser.username
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Registration failed',
      details: error.message 
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    res.json({ 
      success: isMatch,
      message: isMatch ? "Login successful" : "Invalid credentials",
      user: isMatch ? { id: user._id, username: user.username } : null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
});

app.post('/search', async (req, res) => {
  try {
    const { username, query } = req.body;
    if (!username || !query) {
      return res.status(400).json({
        success: false,
        message: "Username and query are required"
      });
    }

    const result = await User.updateOne(
      { username },
      { $push: { searchHistory: { query, date: new Date() } } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Search saved successfully"
    });
  } catch (err) {
    console.error('Search save error:', err);
    res.status(500).json({
      success: false,
      message: "Error saving search",
      error: err.message
    });
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Try these endpoints:');
  console.log('POST /register - Register a new user');
  console.log('POST /login - User login');
  console.log('POST /search - Save search history');
});