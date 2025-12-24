const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { redisClient } = require('../config/redis');

// Diagnostic endpoint
router.get('/status', async (req, res) => {
    try {
        const status = {
            server: 'running',
            timestamp: new Date().toISOString(),
            mongodb: {
                status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                readyState: mongoose.connection.readyState,
                host: mongoose.connection.host,
                name: mongoose.connection.name
            },
            redis: {
                status: redisClient.isOpen ? 'connected' : 'disconnected',
                isReady: redisClient.isReady
            },
            environment: process.env.NODE_ENV,
            uptime: process.uptime()
        };

        res.json({ success: true, ...status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
