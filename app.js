// app.js - Main Application Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initializeDatabase } = require('./db');
const { generalRateLimiter } = require('./middleware/rateLimiter');
const { swaggerUi, swaggerDocs } = require('./config/swagger');

// Import routes
const mainRoutes = require('./mainRoutes/main');
const indexRoutes = require('./mainRoutes/index');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors());

// General rate limiting
app.use(generalRateLimiter);

// Template engine
app.set("view engine", "pug");
app.set("views", "./views");

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files
app.use(express.static('public'));

// Initialize database
initializeDatabase();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        message: 'Data Pusher API is running',
        timestamp: new Date().toISOString()
    });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API Routes
app.use('/api', mainRoutes);

// Index routes
app.use('/', indexRoutes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Data Pusher API Server`);
    console.log(`========================================`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`========================================`);
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n========================================');
    console.log('Shutting down gracefully...');
    console.log('========================================');
    
    server.close(() => {
        console.log('HTTP server closed');
        
        const { closeDatabase } = require('./db');
        closeDatabase();
        
        console.log('Shutdown complete');
        process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Forcing shutdown...');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = app;
