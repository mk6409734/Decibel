const mongoose = require("mongoose")


mongoose.set("strictQuery", true);
const URI = "mongodb://127.0.0.1:27017/decibal";

const connectDb = async() =>  {
    try {
        // mongoose.set("strictQuery", false);
        await mongoose.connect(URI)
        console.log("connection successful to DB");
        
    } catch (error) {
        console.error("database connection failed", error.message)
        process.exit(0)
    }
}

module.exports = connectDb; 