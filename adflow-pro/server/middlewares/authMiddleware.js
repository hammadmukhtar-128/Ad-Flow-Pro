const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  console.log('[AUTH MIDDLEWARE] URL:', req.path);
  console.log('[AUTH MIDDLEWARE] Headers:', req.headers);
  
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Not authorized, invalid token payload' });
      }
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  console.log('[AUTH MIDDLEWARE] No token found in headers');
  return res.status(401).json({ message: 'Not authorized, no token' });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    const normalizedRole = req.user?.role ? req.user.role.toLowerCase() : null;
    const normalizedRoles = roles.map((r) => r.toLowerCase());

    if (!req.user || !normalizedRoles.includes(normalizedRole)) {
      return res.status(403).json({ message: `Role ${req.user ? req.user.role : 'Unknown'} is not authorized to access this route` });
    }

    next();
  };
};

module.exports = { protect, authorize };
