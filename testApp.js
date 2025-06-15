// testApp.js
const express = require('express');
const app = express();
const { createAccount } = require('./modules/models/account');


// Middleware to parse JSON bodies
app.use(express.json());

// Simple route for testing
app.post('/account/createAccount', (req, res) => {
  console.log('Request received:', req.body);
  
  createAccount(req.body, (error, result) => {
    if (error) {
      res.status(500).send('Error creating account');
    } else {
      res.send(result || 'Account created');
    }
  });
});

// Catch 404 errors
app.use((req, res, next) => {
  res.status(404).send('Route not found');
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});