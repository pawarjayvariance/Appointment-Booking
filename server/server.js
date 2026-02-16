require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');
const { connectRedis } = require('./src/config/redis');
const { initScheduler } = require('./src/config/scheduler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(require('path').join(__dirname, 'public')));

// Inject Socket.io into requests
app.use((req, res, next) => {
    req.io = io;
    next();
});

// routes 
app.use('/api', apiRoutes);

// Error handling middleware 
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);

    // Handle Multer specifically for better client feedback
    if (err.name === 'MulterError') {
        let message = 'File upload error';
        if (err.code === 'LIMIT_FILE_SIZE') message = 'File size too large. Max limit is 2MB.';
        return res.status(400).json({ error: message });
    }

    // Handle generic file filter errors (passed as Error from fileFilter)
    if (err.message && (err.message.includes('Invalid file type') || err.message.includes('allowed'))) {
        return res.status(400).json({ error: err.message });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Database connection check & Redis init
const startServer = async () => {
    try {
        await connectRedis();
        initScheduler();
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};


io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

startServer();
