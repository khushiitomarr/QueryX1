import mongoose from "mongoose";

const schema = new mongoose.Schema({
  userId: String,
  query: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("SearchHistory", schema);