export const isSuperAdminUser = (officer) => {
  if (officer) {
    if (
      officer.role === "SuperAdmin" ||
      officer.role === "super_admin" ||
      officer.username === "SPMalegaon" ||
      officer.access_scope === "ALL"
    ) {
      return true;
    }
  }
  try {
    const adminUser = JSON.parse(localStorage.getItem("pcms_admin_user") || "null");
    if (adminUser?.id || adminUser?.username === "SPMalegaon") return true;

    const policeOfficer = JSON.parse(localStorage.getItem("policeOfficer") || "null");
    if (
      policeOfficer?.role === "SuperAdmin" ||
      policeOfficer?.role === "super_admin" ||
      policeOfficer?.username === "SPMalegaon" ||
      policeOfficer?.access_scope === "ALL"
    ) {
      return true;
    }
  } catch (e) {
    console.warn("isSuperAdminUser parse notice:", e);
  }
  return false;
};
