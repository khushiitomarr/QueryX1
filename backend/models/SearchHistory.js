import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  query: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("SearchHistory", schema);