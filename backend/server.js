import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./utils/db.js";
import searchRoutes from "./routes/search.js";
import aiRoutes from "./routes/ai.js";
import suggestRoutes from "./routes/suggest.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import imageRoutes from "./routes/images.js";
import videoRoutes from "./routes/videos.js";
import verifyUser  from "./middleware/auth.js";



// Load env
dotenv.config();
console.log("ENV LOADED?", process.env.MONGO_URI);

// Create app
const app = express();

// CORS

app.use(cors({
  origin: ["http://localhost:5173", "https://query-x1.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.options("*", cors());

// Body parser
app.use(express.json());

// Connect DB
connectDB();

// ROUTES MUST COME AFTER APP IS CREATED
app.use("/api/search", verifyUser, searchRoutes);
app.use("/api/ai", verifyUser, aiRoutes);
app.use("/api/images", verifyUser, imageRoutes);
app.use("/api/videos", verifyUser, videoRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/suggest", suggestRoutes);

// PORT
const PORT = process.env.PORT || 5000;

// START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});