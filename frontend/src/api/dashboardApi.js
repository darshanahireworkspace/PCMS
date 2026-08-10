import API from "./axios";

export const getDashboardStats = (policeStation = "") => {
  return API.get("/dashboard/stats", {
    params: {
      police_station: policeStation,
    },
  });
};