import dotenv from 'dotenv';
import app from './app.js';

// Load environment variables from .env file
dotenv.config();

// Read port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});