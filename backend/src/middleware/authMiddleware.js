const jwt = require('jsonwebtoken');

// Protects routes - checks for a valid JWT in the Authorization header.
// Attaches the decoded user info to req.user so controllers can use it
// (e.g. bookingController uses req.user.id)
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization; // format: "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;