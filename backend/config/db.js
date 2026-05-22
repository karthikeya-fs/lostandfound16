const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || !String(uri).trim()) {
    console.error(
      "\n❌ MongoDB Connection Error: MONGO_URI is missing in backend/.env\n" +
        "   Example: MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/lostandfound\n"
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("\n❌ MongoDB Connection Error:", error.message);
    if (/authentication failed/i.test(error.message)) {
      console.error("   → Check username/password in MONGO_URI.");
    }
    if (/IP whitelist|network/i.test(error.message)) {
      console.error("   → In Atlas: Network Access → allow your IP.");
    }
    console.error("");
    process.exit(1);
  }
};

module.exports = connectDB;
