const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Meal = require('./models/Meal'); 
const User = require('./models/User');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // ให้บริการไฟล์จากโฟลเดอร์ public



// เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Route สำหรับ API
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ error: 'User already exists' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, username: user.username });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// **API Route to Get All Meals**
app.get('/api/Meals', async (req, res) => {
    try {
        const meals = await Meal.find();
        res.json(meals);
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).send('Error fetching meals');
    }
});

// **API Route to Add a New Meal**
app.post('/api/Meals', async (req, res) => {
    const { name, image, probability } = req.body;

    if (!name || !image || !probability) {
        return res.status(400).send('Invalid meal data');
    }

    try {
        const newMeal = new Meal({ name, image, probability });
        await newMeal.save();
        res.status(201).send('Meal added successfully');
    } catch (error) {
        console.error('Error adding meal:', error);
        res.status(500).send('Error adding meal');
    }
});

// **Delete Meal by ID**
// **Delete Meal by ID using Mongoose**
app.delete('/api/Meals/:id', async (req, res) => {
    try {
        const mealId = req.params.id;

        if (!ObjectId.isValid(mealId)) {
            return res.status(400).json({ message: 'Invalid meal ID' });
        }

        const result = await Meal.findByIdAndDelete(mealId);

        if (result) {
            res.status(200).send('Meal deleted successfully');
        } else {
            res.status(404).send('Meal not found');
        }
    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).send('Error deleting meal');
    }
});


// **Add Meal History Entry**
app.post('/api/history', async (req, res) => {
    try {
        const history = req.body;
        history.timestamp = new Date().toISOString();

        await mongoose.connection.collection('history').insertOne(history);
        res.status(201).send('History added successfully');
    } catch (error) {
        console.error('Error adding history:', error);
        res.status(500).send('Error adding history');
    }
});

// **Get Meal History**
app.get('/api/history', async (req, res) => {
    try {
        const history = await mongoose.connection.collection('history').find().toArray();
        res.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).send('Error fetching history');
    }
});

// **Clear Old Meal History (older than 2 minutes)**
app.delete('/api/history/clear', async (req, res) => {
    try {
        const cutoffTime = new Date();
        cutoffTime.setUTCMinutes(cutoffTime.getUTCMinutes() - 2);

        const result = await mongoose.connection.collection('history').deleteMany({
            timestamp: { $lt: cutoffTime.toISOString() }
        });

        res.status(200).send(`Cleared ${result.deletedCount} old history entries.`);
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).send('Error clearing history');
    }
});

// กำหนด Route สำหรับหน้าเว็บ (กรณีเข้าถึงจาก /)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/username', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];  // ดึง Token จาก Header
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);  // ตรวจสอบ Token
        const user = await User.findById(decoded.id);  // ค้นหาผู้ใช้ในฐานข้อมูล

        if (user) {
            res.json({ username: user.username });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});


function getUserFromToken(req) {
    const token = req.headers.authorization?.split(' ')[1]; // ดึง token จาก header

    if (!token) {
        throw new Error('No token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // ตรวจสอบและถอดรหัส token
        return User.findById(decoded.id); // ค้นหาผู้ใช้จากฐานข้อมูลตาม id ใน token
    } catch (error) {
        throw new Error('Invalid token');
    }
}


module.exports = getUserFromToken;

// เริ่มต้นเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT},http://localhost:3000/`));

