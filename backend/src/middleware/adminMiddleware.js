// Runs after authMiddleware - checks the decoded token has role 'admin'.
// Used to protect event-creation so random users can't create events.
function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = adminMiddleware;