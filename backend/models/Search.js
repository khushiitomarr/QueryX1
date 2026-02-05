import mongoose from "mongoose";

const searchSchema = new mongoose.Schema({
  query: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Search", searchSchema);
