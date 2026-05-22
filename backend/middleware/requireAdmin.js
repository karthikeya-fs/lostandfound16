const requireAdmin = (req, res, next) => {
  const role = req.userRole || req.userDoc?.role;
  if (role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }
  next();
};

module.exports = requireAdmin;
