const express = require('express');
const cors = require('cors');
const { calculateHealthReport } = require('./algorithms/healthReport');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// AI Health Analysis Endpoint
app.post('/api/scan/analyze', (req, res) => {
    try {
        const scanData = req.body;
        
        // Simulating artificial delay for "Deep AI Processing"
        setTimeout(() => {
            const report = calculateHealthReport(scanData);
            res.json(report);
        }, 1500);
        
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Internal health analysis failed' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'active', version: '1.0.0', algorithm: 'rPPG-Sim-v2' });
});

app.listen(PORT, () => {
    console.log(`HeartGuard AI Backend running on port ${PORT}`);
});
