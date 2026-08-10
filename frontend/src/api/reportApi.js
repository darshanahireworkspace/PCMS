import API from "./axios";

export const getReports = () => {
  return API.get("/reports");
};