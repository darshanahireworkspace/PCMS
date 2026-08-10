const authService = require("../services/authService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

exports.loginOfficer = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const result = await authService.loginOfficer(username, password);
    return sendSuccess(res, 200, "Login successful", result.officer, {
      token: result.token,
      officer: result.officer,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || "Login failed", error);
  }
};
