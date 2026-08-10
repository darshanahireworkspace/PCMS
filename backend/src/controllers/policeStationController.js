const policeStationService = require("../services/policeStationService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

exports.getPoliceStations = async (req, res) => {
  try {
    const result = await policeStationService.getAllPoliceStations();
    return sendSuccess(res, 200, "Police stations retrieved successfully", result.data, { count: result.count });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch police stations", error.message);
  }
};

exports.getSinglePoliceStation = async (req, res) => {
  try {
    const data = await policeStationService.getPoliceStationById(req.params.id);
    if (!data) {
      return sendError(res, 404, "Police station not found");
    }
    return sendSuccess(res, 200, "Police station retrieved successfully", data);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch police station", error.message);
  }
};

exports.createPoliceStation = async (req, res) => {
  try {
    const data = await policeStationService.createPoliceStation(req.body);
    return sendSuccess(res, 201, "Police station created successfully", data);
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || "Failed to create police station", error);
  }
};

exports.updatePoliceStation = async (req, res) => {
  try {
    const data = await policeStationService.updatePoliceStation(req.params.id, req.body);
    return sendSuccess(res, 200, "Police station updated successfully", data);
  } catch (error) {
    return sendError(res, 500, "Failed to update police station", error.message);
  }
};

exports.deletePoliceStation = async (req, res) => {
  try {
    await policeStationService.deletePoliceStation(req.params.id);
    return sendSuccess(res, 200, "Police station deleted successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to delete police station", error.message);
  }
};
