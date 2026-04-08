module.exports = (req, res, next) => {
  if (req.user.verification_status !== "verified") {
    return res.status(403).json({
      message: "Account not verified",
    });
  }
  next();
};