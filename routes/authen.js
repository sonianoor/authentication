const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// JWT Secret Key (use a secure, long, and random string)
const JWT_SECRET = "your_super_secret_key";

// Middleware to protect routes
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
    if (!token) return res.status(401).json({ error: 'Access Denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid Token' });
        req.user = user; // Add user data to request object
        next();
    });
}

// Registration Route
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' } // Token valid for 1 hour
        );

        res.status(200).json({ message: 'Login successful!', token });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Protected Route Example (Stay Logged In)
router.get('/dashboard', authenticateToken, (req, res) => {
    res.status(200).json({ message: 'Welcome to the dashboard!', user: req.user });
});

// Logout Route (Client-Side Token Deletion)
router.post('/logout', (req, res) => {
    // Simply inform the client to delete their token
    res.status(200).json({ message: 'Logged out successfully!' });
});

module.exports = router;
