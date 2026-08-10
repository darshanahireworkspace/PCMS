const officerService = require("../services/officerService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

exports.getOfficers = async (req, res) => {
  try {
    const result = await officerService.getAllOfficers();
    return sendSuccess(res, 200, "Officers retrieved successfully", result.data, { count: result.count });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch officers", error.message);
  }
};

exports.getSingleOfficer = async (req, res) => {
  try {
    const data = await officerService.getOfficerById(req.params.id);
    if (!data) {
      return sendError(res, 404, "Officer not found");
    }
    return sendSuccess(res, 200, "Officer retrieved successfully", data);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch officer", error.message);
  }
};

exports.createOfficer = async (req, res) => {
  try {
    const data = await officerService.createOfficer(req.body);
    return sendSuccess(res, 201, "Officer created successfully", data);
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || "Failed to create officer", error);
  }
};

exports.updateOfficer = async (req, res) => {
  try {
    const data = await officerService.updateOfficer(req.params.id, req.body);
    return sendSuccess(res, 200, "Officer updated successfully", data);
  } catch (error) {
    return sendError(res, 500, "Failed to update officer", error.message);
  }
};

exports.deleteOfficer = async (req, res) => {
  try {
    await officerService.deleteOfficer(req.params.id);
    return sendSuccess(res, 200, "Officer deleted successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to delete officer", error.message);
  }
};
