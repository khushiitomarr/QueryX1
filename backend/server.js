import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./utils/db.js";
import searchRoutes from "./routes/search.js";
// import aiRoutes from "./routes/ai.js";
import suggestRoutes from "./routes/suggest.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

connectDB();

app.use("/api/search", searchRoutes);
//app.use("/api/ai", aiRoutes);
app.use("/api/suggest", suggestRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
// console.log("GROQ KEY:", process.env.GROQ_API_KEY);
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});