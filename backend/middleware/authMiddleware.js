// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// Middleware: verify that the request has a valid JWT token
// Usage: router.post('/', protect, handler)   ← put "protect" before the handler
const protect = (req, res, next) => {
  try {
    // 1. Get the Authorization header
    const authHeader = req.headers.authorization;

    // 2. Check that it exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    // 3. Extract the token (everything after "Bearer ")
    const token = authHeader.split(' ')[1];

    // 4. Verify the token with our secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach the decoded payload to req so routes can access it
    //    decoded = { id: "651abc...", role: "admin", iat, exp }
    req.user = decoded;

    // 6. Continue to the route handler
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid or expired token',
    });
  }
};

// Middleware: only allow a specific role to proceed
// Usage: router.post('/', protect, requireRole('admin'), handler)
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({
      success: false,
      message: `Access denied — ${role} role required`,
    });
  }
  next();
};

module.exports = { protect, requireRole };