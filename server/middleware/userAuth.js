import jwt from 'jsonwebtoken';

export function validateUserAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    req.userId = decoded.sub || decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
