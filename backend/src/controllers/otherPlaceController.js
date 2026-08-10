const otherPlaceService = require("../services/otherPlaceService");
const storageService = require("../services/storageService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

exports.getOtherPlaces = async (req, res) => {
  try {
    const result = await otherPlaceService.getAllOtherPlaces(req.query);
    return sendSuccess(res, 200, "Other places retrieved successfully", result.data, { count: result.count });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch other places", error.message);
  }
};

exports.getSingleOtherPlace = async (req, res) => {
  try {
    const data = await otherPlaceService.getOtherPlaceById(req.params.id);
    if (!data) {
      return sendError(res, 404, "Record not found");
    }
    return sendSuccess(res, 200, "Other place retrieved successfully", data);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch record", error.message);
  }
};

exports.createOtherPlace = async (req, res) => {
  try {
    let photoUrl = req.body.photo_url || req.body.photo || null;
    if (req.file) {
      photoUrl = await storageService.uploadPhoto(req.file, "other-places");
    }

    const payload = {
      ...req.body,
      photo_url: photoUrl,
    };
    delete payload.photo;

    const officerId = req.officer?.id || null;
    const data = await otherPlaceService.createOtherPlace(payload, officerId);
    return sendSuccess(res, 201, "Other place created successfully", data);
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || "Failed to add other place", error);
  }
};

exports.updateOtherPlace = async (req, res) => {
  try {
    let photoUrl = req.body.photo_url || req.body.photo || undefined;
    if (req.file) {
      photoUrl = await storageService.uploadPhoto(req.file, "other-places");
    } else if (req.body.existing_photo === "") {
      photoUrl = null;
    }

    const payload = { ...req.body };
    if (photoUrl !== undefined) {
      payload.photo_url = photoUrl;
    }
    delete payload.photo;
    delete payload.existing_photo;

    const data = await otherPlaceService.updateOtherPlace(req.params.id, payload);
    return sendSuccess(res, 200, "Other place updated successfully", data);
  } catch (error) {
    return sendError(res, 500, "Failed to update other place", error.message);
  }
};

exports.deleteOtherPlace = async (req, res) => {
  try {
    const item = await otherPlaceService.getOtherPlaceById(req.params.id);
    if (item?.photo_url) {
      await storageService.deletePhoto(item.photo_url);
    }
    await otherPlaceService.deleteOtherPlace(req.params.id);
    return sendSuccess(res, 200, "Other place deleted successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to delete other place", error.message);
  }
};
