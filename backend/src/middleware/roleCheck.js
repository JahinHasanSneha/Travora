// Role-based routing protection: restricts endpoints to specific user_type(s)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.user_type)) {
      return res.status(403).json({
        error: `Forbidden: this endpoint requires one of [${allowedRoles.join(', ')}] role(s).`,
      });
    }
    next();
  };
}

module.exports = { requireRole };
// 401	User is not authenticated
// 403	User is authenticated, but doesn't have permission