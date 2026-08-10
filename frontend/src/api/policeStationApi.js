import API from "./axios";

export const getPoliceStations = () => {
  return API.get("/police-stations");
};

export const createPoliceStation = (data) => {
  return API.post("/police-stations", data);
};

export const deletePoliceStation = (id) => {
  return API.delete(`/police-stations/${id}`);
};