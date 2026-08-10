import API from "./axios";

export const createFestivalPermission = (formData) => {
  return API.post("/festival-permissions", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getFestivalPermissions = () => {
  return API.get("/festival-permissions");
};

export const getSingleFestivalPermission = (id) => {
  return API.get(`/festival-permissions/${id}`);
};

export const updateFestivalPermission = (id, data) => {
  return API.put(`/festival-permissions/${id}`, data);
};

export const deleteFestivalPermission = (id) => {
  return API.delete(`/festival-permissions/${id}`);
};