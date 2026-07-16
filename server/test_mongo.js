const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.set('debug', true);

async function testConnection() {
  try {
    console.log("URI:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("SUCCESS!");
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
}

testConnection();
