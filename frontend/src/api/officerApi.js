import API from "./axios";

export const getOfficers = () => API.get("/officers");
export const createOfficer = (data) => API.post("/officers", data);
export const updateOfficer = (id, data) => API.put(`/officers/${id}`, data);
export const deleteOfficer = (id) => API.delete(`/officers/${id}`);
