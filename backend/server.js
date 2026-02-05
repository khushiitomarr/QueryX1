import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./utils/db.js";
import searchRoutes from "./routes/search.js";
import aiRoutes from "./routes/ai.js";
import suggestRoutes from "./routes/suggest.js";
import authRoutes from "./routes/auth.js";


// Load env
dotenv.config();
console.log("ENV LOADED?", process.env.MONGO_URI);

// Create app
const app = express();

// CORS
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"]
}));

// Body parser
app.use(express.json());

// Connect DB
connectDB();

// ROUTES MUST COME AFTER APP IS CREATED
app.use("/api/search", searchRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/suggest", suggestRoutes);
app.use("/api/auth", authRoutes);

// PORT
const PORT = process.env.PORT || 5000;

// START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
