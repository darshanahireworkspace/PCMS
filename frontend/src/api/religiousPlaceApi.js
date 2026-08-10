import API from "./axios";

export const createReligiousPlace = (formData) => {
  return API.post("/religious-places", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getReligiousPlaces = () => {
  return API.get("/religious-places");
};

export const getSingleReligiousPlace = (id) => {
  return API.get(`/religious-places/${id}`);
};

export const deleteReligiousPlace = (id) => {
  return API.delete(`/religious-places/${id}`);
};

export const updateReligiousPlace = (id, data) => {
  return API.put(`/religious-places/${id}`, data);
};