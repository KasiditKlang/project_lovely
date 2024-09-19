const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the 'outputs' directory
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));  // For HTML, CSS, and JS

// Serve the data.json file
app.use('/data.json', express.static(path.join(__dirname, 'data.json')));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'rndfood.html'));  // Ensure this path is correct
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});