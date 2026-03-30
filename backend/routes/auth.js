import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "User exists" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token, name: user.name });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email});
  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token, name: user.name });
});

export default router;