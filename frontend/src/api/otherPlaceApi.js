import API from "./axios";

export const createOtherPlace = (formData) => {
  return API.post("/other-places", formData);
};

export const getOtherPlaces = () => {
  return API.get("/other-places");
};

export const getSingleOtherPlace = (id) => {
  return API.get(`/other-places/${id}`);
};

export const updateOtherPlace = (id, formData) => {
  return API.put(`/other-places/${id}`, formData);
};

export const deleteOtherPlace = (id) => {
  return API.delete(`/other-places/${id}`);
};