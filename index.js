const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the 'outputs' directory
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// Serve the data.json file
app.get('/data.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'data.json'));
});

app.use(express.static(path.join(__dirname, 'public')));
// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'rndfood.html'));  // Ensure this path is correct
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
