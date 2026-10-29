const mongoose = require('mongoose');
const { MONGO_URI, NODE_ENV } = require('./env');

let retryInterval = null;

const connectionOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  connectTimeoutMS: 5000,
};

// Set up connection event listeners once
let listenersInitialized = false;
function initEventListeners() {
  if (listenersInitialized) return;
  listenersInitialized = true;

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected — Mongoose will auto-reconnect');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected successfully');
  });
  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
  });
}

function printTroubleshootingGuide(uri, errorMsg) {
  console.error('\n' + '='.repeat(70));
  console.error(`❌ MongoDB connection failed: ${errorMsg}`);
  console.error(`   Target URI: ${uri}`);
  console.error('='.repeat(70));
  console.error('💡 HOW TO FIX THIS DATABASE CONNECTION ISSUE:');
  console.error('');
  console.error('Option 1 (Start MongoDB Windows Service):');
  console.error('   1. Double-click the "start-mongodb.bat" script in the Hirehub folder.');
  console.error('      OR');
  console.error('   2. Open PowerShell as Administrator and run:');
  console.error('      net start MongoDB');
  console.error('      (or run "services.msc", locate "MongoDB Server", and click "Start")');
  console.error('');
  console.error('Option 2 (Connect with MongoDB Compass):');
  console.error('   Once MongoDB service is running, open Compass and connect to:');
  console.error('   mongodb://127.0.0.1:27017');
  console.error('');
  console.error('Option 3 (MongoDB Atlas Cloud Database):');
  console.error('   If you do not have local MongoDB running, use a free cloud Atlas cluster.');
  console.error('   Update MONGO_URI in Backend/NodeBackend/.env with your connection string:');
  console.error('   MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/hirehub');
  console.error('='.repeat(70) + '\n');
}

/**
 * Attempts connection with fallback between 127.0.0.1 and localhost
 */
async function tryConnect(uri) {
  return await mongoose.connect(uri, connectionOptions);
}

const connectDB = async () => {
  initEventListeners();

  // Try initial URI and its alternative (127.0.0.1 <-> localhost) if local
  const urisToTry = [MONGO_URI];
  if (MONGO_URI.includes('127.0.0.1:27017')) {
    urisToTry.push(MONGO_URI.replace('127.0.0.1:27017', 'localhost:27017'));
  } else if (MONGO_URI.includes('localhost:27017')) {
    urisToTry.push(MONGO_URI.replace('localhost:27017', '127.0.0.1:27017'));
  }

  let connected = false;
  let lastError = null;

  for (const uri of urisToTry) {
    try {
      const conn = await tryConnect(uri);
      console.log(`✅ MongoDB connected: ${conn.connection.host}:${conn.connection.port || '27017'}/${conn.connection.name}`);
      connected = true;
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (connected) {
    if (retryInterval) {
      clearInterval(retryInterval);
      retryInterval = null;
    }
    return;
  }

  // Connection failed
  printTroubleshootingGuide(MONGO_URI, lastError ? lastError.message : 'Connection refused');

  if (NODE_ENV === 'production') {
    process.exit(1);
  } else {
    // In development: keep server alive and retry in the background every 5 seconds
    console.warn('⚠️  Server started in offline database mode. Retrying connection in background every 5s...');
    if (!retryInterval) {
      retryInterval = setInterval(async () => {
        if (mongoose.connection.readyState === 1) {
          clearInterval(retryInterval);
          retryInterval = null;
          return;
        }
        for (const uri of urisToTry) {
          try {
            const conn = await tryConnect(uri);
            console.log(`\n🎉 MongoDB connected: ${conn.connection.host}:${conn.connection.port || '27017'}/${conn.connection.name}`);
            clearInterval(retryInterval);
            retryInterval = null;
            return;
          } catch {
            // keep waiting silently
          }
        }
      }, 5000);
    }
  }
};

module.exports = connectDB;
