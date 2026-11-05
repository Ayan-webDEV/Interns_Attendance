import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing. Add it to server/.env.');

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      // Keep TLS certificate validation enabled. Never disable TLS validation to bypass Atlas errors.
    });
    console.log(`MongoDB connected (${mongoose.connection.name})`);
  } catch (error) {
    const message = String(error?.message || error);
    console.error('MongoDB connection failed.');
    if (/ERR_SSL|TLS|SSL alert|handshake/i.test(message)) {
      console.error('TLS handshake failed. Check Atlas Network Access, the exact Atlas SRV connection string, system date/time, VPN/proxy/antivirus HTTPS inspection, and whether your network allows outbound MongoDB TLS traffic. Try a mobile hotspot to isolate the network.');
    } else if (/whitelist|not authorized|IP address/i.test(message)) {
      console.error('Check MongoDB Atlas → Security → Network Access and allow your current public IP address.');
    } else if (/authentication failed|bad auth/i.test(message)) {
      console.error('Check the Atlas Database Access username/password and URL-encode special characters in the password.');
    } else if (/ENOTFOUND|DNS|querySrv/i.test(message)) {
      console.error('Check DNS/network access and copy the complete mongodb+srv:// connection string from Atlas → Connect → Drivers.');
    }
    console.error(`Details: ${message}`);
    throw error;
  }
}
