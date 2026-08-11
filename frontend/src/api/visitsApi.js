import API from "./axios";

export const getPlaceVisits = (placeId) => API.get(`/visits?place_id=${placeId}`);
export const recordPlaceVisit = (data) => API.post("/visits", data);
export const checkPlaceDuplicate = (data) => API.post("/religious-places/check-duplicate", data);
