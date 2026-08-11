import API from "./axios";

export const loginOfficerApi = (data) => {
  return API.post("/auth/login", data);
};

export const loginOfficer = (data) => {
  return API.post("/auth/login", data);
};