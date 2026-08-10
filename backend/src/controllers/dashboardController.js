const dashboardService = require("../services/dashboardService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

exports.getDashboardStats = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardStats(req.query);
    return res.status(200).json({
      success: true,
      stats: data.stats,
      religiousPlaces: data.religiousPlaces,
      festivalPermissions: data.festivalPermissions,
      otherPlaces: data.otherPlaces,
    });
  } catch (error) {
    return sendError(res, 500, "Dashboard data error", error.message);
  }
};
