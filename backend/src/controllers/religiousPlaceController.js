const religiousPlaceService = require("../services/religiousPlaceService");
const storageService = require("../services/storageService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

exports.getReligiousPlaces = async (req, res) => {
  try {
    const result = await religiousPlaceService.getAllReligiousPlaces(req.query);
    return sendSuccess(res, 200, "Religious places retrieved successfully", result.data, { count: result.count });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch religious places", error.message);
  }
};

exports.getSingleReligiousPlace = async (req, res) => {
  try {
    const data = await religiousPlaceService.getReligiousPlaceById(req.params.id);
    if (!data) {
      return sendError(res, 404, "Religious place not found");
    }
    return sendSuccess(res, 200, "Religious place retrieved successfully", data);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch record", error.message);
  }
};

exports.createReligiousPlace = async (req, res) => {
  try {
    let imageUrl = req.body.image_url || req.body.image || null;
    if (req.file) {
      imageUrl = await storageService.uploadPhoto(req.file, "religious-places");
    }

    const payload = {
      ...req.body,
      image_url: imageUrl,
    };
    delete payload.image;

    const officerId = req.officer?.id || null;
    const data = await religiousPlaceService.createReligiousPlace(payload, officerId);
    return sendSuccess(res, 201, "Religious place created successfully", data);
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || "Failed to create religious place", error);
  }
};

exports.updateReligiousPlace = async (req, res) => {
  try {
    let imageUrl = req.body.image_url || req.body.image || undefined;
    if (req.file) {
      imageUrl = await storageService.uploadPhoto(req.file, "religious-places");
    }

    const payload = { ...req.body };
    if (imageUrl !== undefined) {
      payload.image_url = imageUrl;
    }
    delete payload.image;

    const data = await religiousPlaceService.updateReligiousPlace(req.params.id, payload);
    return sendSuccess(res, 200, "Religious place updated successfully", data);
  } catch (error) {
    return sendError(res, 500, "Failed to update religious place", error.message);
  }
};

exports.deleteReligiousPlace = async (req, res) => {
  try {
    const place = await religiousPlaceService.getReligiousPlaceById(req.params.id);
    if (place?.image_url) {
      await storageService.deletePhoto(place.image_url);
    }
    await religiousPlaceService.deleteReligiousPlace(req.params.id);
    return sendSuccess(res, 200, "Religious place deleted successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to delete religious place", error.message);
  }
};
