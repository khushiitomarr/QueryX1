import jwt from "jsonwebtoken";

export default function (req, res, next) {
  const authHeader = req.headers.authorization;

  // ✅ No token → allow guest
  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  // ✅ invalid token → skip
  if (!token || token === "null" || token === "undefined") {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.log("JWT ERROR:", err.message);
    }
    return next(); // don't crash backend
  }

  next();
}
