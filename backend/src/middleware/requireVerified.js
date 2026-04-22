module.exports = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      message: "Verify your account to continue"
    });
  }
  next();
};