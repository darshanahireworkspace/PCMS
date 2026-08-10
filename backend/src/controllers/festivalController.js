const festivalPermissionService = require("../services/festivalPermissionService");
const storageService = require("../services/storageService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

exports.getFestivalPermissions = async (req, res) => {
  try {
    const result = await festivalPermissionService.getAllFestivalPermissions(req.query);
    return sendSuccess(res, 200, "Festival permissions fetched successfully", result.data, { count: result.count });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch festival permissions", error.message);
  }
};

exports.getSingleFestivalPermission = async (req, res) => {
  try {
    const data = await festivalPermissionService.getFestivalPermissionById(req.params.id);
    if (!data) {
      return sendError(res, 404, "Festival permission not found");
    }
    return sendSuccess(res, 200, "Festival permission fetched successfully", data);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch festival permission", error.message);
  }
};

const isValidUuid = (val) => {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
};

const sanitizeFestivalPayload = (body) => {
  const payload = { ...body };

  // Strict UUID Normalization: If valid UUID format, use trimmed value; if empty/null/undefined, set to null!
  if (payload.religious_place_id !== undefined && payload.religious_place_id !== null) {
    const rawVal = String(payload.religious_place_id).trim();
    if (rawVal === "" || rawVal === "null" || rawVal === "undefined") {
      payload.religious_place_id = null;
    } else if (isValidUuid(rawVal)) {
      payload.religious_place_id = rawVal;
    } else {
      throw { statusCode: 400, message: "Invalid religious place selection." };
    }
  } else {
    payload.religious_place_id = null;
  }

  if (payload.assigned_officer !== undefined && payload.assigned_officer !== null) {
    const rawOfficer = String(payload.assigned_officer).trim();
    if (rawOfficer === "" || rawOfficer === "null" || rawOfficer === "undefined") {
      payload.assigned_officer = null;
    } else if (isValidUuid(rawOfficer)) {
      payload.assigned_officer = rawOfficer;
    } else {
      payload.assigned_officer = null;
    }
  } else {
    payload.assigned_officer = null;
  }

  if (payload.start_date === "" || payload.start_date === "null") payload.start_date = null;
  if (payload.end_date === "" || payload.end_date === "null") payload.end_date = null;
  if (payload.festival_start_date === "" || payload.festival_start_date === "null") payload.festival_start_date = null;
  if (payload.festival_end_date === "" || payload.festival_end_date === "null") payload.festival_end_date = null;
  if (payload.procession_date === "" || payload.procession_date === "null") payload.procession_date = null;

  if (payload.start_time === "" || payload.start_time === "null") payload.start_time = null;
  if (payload.end_time === "" || payload.end_time === "null") payload.end_time = null;
  if (payload.procession_start_time === "" || payload.procession_start_time === "null") payload.procession_start_time = null;
  if (payload.procession_end_time === "" || payload.procession_end_time === "null") payload.procession_end_time = null;

  if (payload.expected_crowd !== undefined && payload.expected_crowd !== null && payload.expected_crowd !== "") {
    const crowdNum = parseInt(payload.expected_crowd, 10);
    payload.expected_crowd = isNaN(crowdNum) ? 0 : crowdNum;
  } else if (payload.expected_crowd === "") {
    payload.expected_crowd = 0;
  }

  if (payload.festival_year !== undefined && payload.festival_year !== null && payload.festival_year !== "") {
    const yearNum = parseInt(payload.festival_year, 10);
    payload.festival_year = isNaN(yearNum) ? new Date().getFullYear() : yearNum;
  }

  if (payload.latitude !== undefined && payload.latitude !== null && payload.latitude !== "") {
    const latNum = parseFloat(payload.latitude);
    payload.latitude = isNaN(latNum) ? null : latNum;
  } else if (payload.latitude === "") {
    payload.latitude = null;
  }

  if (payload.longitude !== undefined && payload.longitude !== null && payload.longitude !== "") {
    const lngNum = parseFloat(payload.longitude);
    payload.longitude = isNaN(lngNum) ? null : lngNum;
  } else if (payload.longitude === "") {
    payload.longitude = null;
  }

  if (payload.organizer_name && !payload.mandal_name) {
    payload.mandal_name = payload.organizer_name;
  }
  if (payload.mandal_name && !payload.organizer_name) {
    payload.organizer_name = payload.mandal_name;
  }
  if (payload.president_mobile && !payload.contact_number) {
    payload.contact_number = payload.president_mobile;
  }
  if (payload.secretary_mobile && !payload.alternate_contact_number) {
    payload.alternate_contact_number = payload.secretary_mobile;
  }
  if (payload.route_details && !payload.procession_route) {
    payload.procession_route = payload.route_details;
  }
  if (payload.police_notes && !payload.police_verification_notes) {
    payload.police_verification_notes = payload.police_notes;
    payload.notes = payload.police_notes;
  }

  delete payload.photo;
  delete payload.image;

  return payload;
};

exports.createFestivalPermission = async (req, res) => {
  try {
    let photoUrl = req.body.photo_url || req.body.photo || null;
    if (req.file) {
      photoUrl = await storageService.uploadPhoto(req.file, "festival-permissions");
    }

    const rawPayload = sanitizeFestivalPayload(req.body);
    const payload = {
      ...rawPayload,
      photo_url: photoUrl,
      sound_permission: req.body.sound_permission === "Yes" || req.body.sound_permission === true || req.body.sound_permission === "1",
      procession: req.body.procession === "Yes" || req.body.procession === true || req.body.procession === "1",
      procession_permission: req.body.procession === "Yes" || req.body.procession === true || req.body.procession === "1",
    };

    const officerId = req.officer?.id || null;
    const data = await festivalPermissionService.createFestivalPermission(payload, officerId);
    return sendSuccess(res, 201, "Festival permission created successfully", data);
  } catch (error) {
    const status = error.statusCode || 500;
    return sendError(res, status, error.message || "Failed to create festival permission", error);
  }
};

exports.updateFestivalPermission = async (req, res) => {
  try {
    let photoUrl = req.body.photo_url || req.body.photo || undefined;
    if (req.file) {
      photoUrl = await storageService.uploadPhoto(req.file, "festival-permissions");
    }

    const rawPayload = sanitizeFestivalPayload(req.body);
    const payload = { ...rawPayload };

    if (photoUrl !== undefined) {
      payload.photo_url = photoUrl;
    }
    if (req.body.sound_permission !== undefined) {
      const isSound = req.body.sound_permission === "Yes" || req.body.sound_permission === true || req.body.sound_permission === "1";
      payload.sound_permission = isSound;
    }
    if (req.body.procession !== undefined) {
      const isProc = req.body.procession === "Yes" || req.body.procession === true || req.body.procession === "1";
      payload.procession = isProc;
      payload.procession_permission = isProc;
    }

    const data = await festivalPermissionService.updateFestivalPermission(req.params.id, payload);
    return sendSuccess(res, 200, "Festival permission updated successfully", data);
  } catch (error) {
    return sendError(res, 500, "Failed to update festival permission", error.message);
  }
};

exports.deleteFestivalPermission = async (req, res) => {
  try {
    const item = await festivalPermissionService.getFestivalPermissionById(req.params.id);
    if (item?.photo_url) {
      await storageService.deletePhoto(item.photo_url);
    }
    await festivalPermissionService.deleteFestivalPermission(req.params.id);
    return sendSuccess(res, 200, "Festival permission deleted successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to delete festival permission", error.message);
  }
};
