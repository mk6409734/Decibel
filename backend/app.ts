import "dotenv/config";
import express from "express";
import connectDB from "./config/dbConnector";
import routes from "./routes";
import auth from "./routes/api/auth";
import config from "config";
import cors from "cors";
import socketManager, { controllerRouter, io } from "./sockets/socketManager";
import * as http from "http";
import capScheduler from "./services/capScheduler";
import CAPSource from "./models/CAPSource";



const connectDb =  require("./utils/db")

const PORT = config.get("serverPort");

//TODO: Integrate testing!

//**********************************Inits**********************************/
const app = express();
const server = http.createServer(app);

app.use(express.json());
connectDB();

// Configure CORS to allow frontend access
app.use(
  cors({
    origin: "*",
  })
);

//**********************************Routes**********************************/
app.use("/api/auth", auth);
app.use(routes); // This includes sirens, districts, cap-alerts, and cap-sources
app.use("/api/controller", controllerRouter);
socketManager.init(server);

// Seed NDMA India source if not exists and start CAP scheduler
const initializeCAPSystem = async () => {
  try {
    // Check if NDMA India source exists
    const ndmaSource = await CAPSource.findOne({ name: "NDMA India" });

    if (!ndmaSource) {
      console.log("Seeding NDMA India CAP source...");
      const newSource = new CAPSource({
        name: "NDMA India",
        url: "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml",
        country: "India",
        language: "en",
        isActive: true,
        isDefault: true,
        fetchInterval: 3,
        description:
          "National Disaster Management Authority of India - Official CAP alerts for disasters and emergencies across India",
        metadata: {
          provider: "National Disaster Management Authority",
          documentation: "https://sachet.ndma.gov.in/",
          contactEmail: "support@ndma.gov.in",
        },
      });
      await newSource.save();
      console.log("NDMA India source created successfully");
    }

    // Start CAP scheduler after socket.io is initialized
    setTimeout(() => {
      capScheduler.setSocketIO(io);
      capScheduler.start();
    }, 1000);
  } catch (error) {
    console.error("Error initializing CAP system:", error);
  }
};

connectDb().then(() => {
  server.listen(PORT, () => {
    console.log("Server is running Go! " + PORT);
    initializeCAPSystem();
  });
});
