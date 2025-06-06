const express = require('express');
const path = require('path');
const winston = require('winston');
const fs = require('fs');
const archiver = require('archiver');

// Configure general logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // Write all logs to separate files
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Also log to console in development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Configure harvest logger
const harvestLogger = {
    logHarvest: (data) => {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp},${data.potId},${data.cropName},${data.quantity},${data.totalHarvest}\n`;
        fs.appendFile('logs/harvestcrops.txt', logEntry, (err) => {
            if (err) {
                logger.error('Error writing to harvest log:', err);
            }
        });
    }
};

const app = express();
const PORT = 3001;

// Parse JSON bodies
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        path: req.path,
        ip: req.ip
    });
    next();
});

// Endpoint to log harvest data
app.post('/api/log-harvest', (req, res) => {
    const { potId, cropName, quantity, totalHarvest } = req.body;
    
    if (!potId || !cropName || quantity === undefined || totalHarvest === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    harvestLogger.logHarvest({ potId, cropName, quantity, totalHarvest });
    res.json({ success: true });
});

// Endpoint to download logs
app.get('/api/download-logs', (req, res) => {
    const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
    });

    // Set the headers
    res.attachment('harvest-logs.zip');
    
    // Pipe archive data to the response
    archive.pipe(res);

    // Add the log files to the archive
    const logDir = path.join(__dirname, 'logs');
    fs.readdirSync(logDir).forEach(file => {
        const filePath = path.join(logDir, file);
        archive.file(filePath, { name: file });
    });

    // Finalize the archive
    archive.finalize();
});

// Error logging middleware
app.use((err, req, res, next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        path: req.path,
        ip: req.ip
    });
    res.status(500).send('Something broke!');
});

// Serve static files
app.use(express.static(__dirname));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create harvest log file with headers if it doesn't exist
const harvestLogFile = 'logs/harvestcrops.txt';
if (!fs.existsSync(harvestLogFile)) {
    fs.writeFileSync(harvestLogFile, 'timestamp,potId,cropName,qty,totalHarvest\n');
}

// Start the server
app.listen(PORT, () => {
    logger.info(`Server is running at http://localhost:${PORT}`);
});