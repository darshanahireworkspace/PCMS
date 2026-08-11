import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getOfficers,
  createOfficer,
  updateOfficer,
  deleteOfficer,
  resetOfficerPassword,
} from "../../api/officerApi";
import { getPoliceStations } from "../../api/policeStationApi";

function OfficersManagement() {
  const [officers, setOfficers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [resetModalOfficer, setResetModalOfficer] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    age: "30",
    email: "",
    gender: "Male",
    police_station_name: "Malegaon Police Headquarters",
    designation: "Constable",
    role: "Officer",
    username: "",
    password: "",
    confirmPassword: "",
    status: "Active",
    access_scope: "OWN",
  });

  const [newPassword, setNewPassword] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [offRes, stRes] = await Promise.all([
        getOfficers(),
        getPoliceStations(),
      ]);

      setOfficers(offRes.data.data || []);
      setStations(stRes.data.data || []);
    } catch (err) {
      console.error("Failed to load officers:", err);
      toast.error("Failed to load officers directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.username) {
      toast.error("Full Name and Username are required");
      return;
    }

    if (!editingOfficer) {
      if (!formData.password) {
        toast.error("Password is required for new officer");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    try {
      if (editingOfficer) {
        const updatePayload = {
          full_name: formData.full_name.trim(),
          mobile: formData.mobile.trim(),
          age: formData.age ? Number(formData.age) : 30,
          gender: formData.gender,
          email: formData.email.trim(),
          police_station_name: formData.police_station_name,
          designation: formData.designation,
          role: formData.role,
          access_scope: formData.access_scope,
          status: formData.status,
        };
        await updateOfficer(editingOfficer.id, updatePayload);
        toast.success("Officer profile updated successfully");
      } else {
        const createPayload = {
          full_name: formData.full_name.trim(),
          username: formData.username.trim(),
          mobile: formData.mobile.trim(),
          age: formData.age ? Number(formData.age) : 30,
          gender: formData.gender,
          email: formData.email.trim(),
          police_station_name: formData.police_station_name,
          designation: formData.designation,
          role: formData.role,
          password: formData.password,
          access_scope: formData.access_scope,
          status: formData.status,
        };
        await createOfficer(createPayload);
        toast.success("Officer created successfully");
      }

      setShowAddModal(false);
      setEditingOfficer(null);
      setFormData({
        full_name: "",
        mobile: "",
        age: "30",
        email: "",
        gender: "Male",
        police_station_name: stations[0]?.station_name || "Malegaon Police Headquarters",
        designation: "Constable",
        role: "Officer",
        username: "",
        password: "",
        confirmPassword: "",
        status: "Active",
        access_scope: "OWN",
      });
      loadData();
    } catch (err) {
      console.error("Save officer error details:", err.response?.data || err);
      const apiErr = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to save officer profile";
      toast.error(apiErr);
    }
  };

  const handleOpenEdit = (officer) => {
    setEditingOfficer(officer);
    setFormData({
      full_name: officer.full_name || "",
      mobile: officer.mobile || officer.username || "",
      age: String(officer.age || "30"),
      email: officer.email || "",
      gender: officer.gender || "Male",
      police_station_name: officer.police_station_name || "Malegaon Police Headquarters",
      designation: officer.designation || "Constable",
      role: officer.role || "Officer",
      username: officer.username || "",
      password: "",
      confirmPassword: "",
      status: officer.status || "Active",
      access_scope: officer.access_scope || "OWN",
    });
    setShowAddModal(true);
  };

  const handleToggleStatus = async (officer) => {
    if (officer.username === "SPMalegaon" || officer.role === "SuperAdmin") {
      toast.error("Super Admin account status cannot be changed");
      return;
    }

    const newStatus = officer.status === "Active" ? "Inactive" : "Active";
    try {
      await updateOfficer(officer.id, { status: newStatus });
      toast.success(`Officer ${officer.full_name} status updated to ${newStatus}`);
      loadData();
    } catch (err) {
      console.error("Status toggle error:", err);
      toast.error("Failed to update officer status");
    }
  };

  const handleDeleteOfficer = async (officer) => {
    if (officer.username === "SPMalegaon" || officer.role === "SuperAdmin") {
      toast.error("Super Admin SPMalegaon account cannot be deleted!");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to permanently delete officer "${officer.full_name}" (${officer.username})? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteOfficer(officer.id);
      toast.success(`Officer "${officer.full_name}" deleted successfully`);
      loadData();
    } catch (err) {
      console.error("Delete officer error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to delete officer");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    try {
      await resetOfficerPassword(resetModalOfficer.id, newPassword);
      toast.success(`Password reset for ${resetModalOfficer.full_name}`);
      setResetModalOfficer(null);
      setNewPassword("");
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  const filteredOfficers = officers.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      o.full_name?.toLowerCase().includes(q) ||
      o.username?.toLowerCase().includes(q) ||
      o.designation?.toLowerCase().includes(q) ||
      o.role?.toLowerCase().includes(q) ||
      o.police_station_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-page-container">
      <div className="admin-header-row">
        <div>
          <h2>Officers Management</h2>
          <p>Manage police personnel profiles, credentials, roles & data access scope</p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={() => {
            setEditingOfficer(null);
            setFormData({
              full_name: "",
              mobile: "",
              age: "30",
              email: "",
              gender: "Male",
              police_station_name: stations[0]?.station_name || "Malegaon Police Headquarters",
              designation: "Constable",
              role: "Officer",
              username: "",
              password: "",
              confirmPassword: "",
              status: "Active",
              access_scope: "OWN",
            });
            setShowAddModal(true);
          }}
        >
          <UserPlus size={16} />
          Add Officer
        </button>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="admin-toolbar-card">
        <div className="admin-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search officers by name, username, designation, role, station..."
          />
        </div>
      </div>

      {/* OFFICERS TABLE */}
      <div className="admin-table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Officer Name</th>
                <th>Username</th>
                <th>Station</th>
                <th>Role</th>
                <th>Access Scope</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-muted">
                    Loading officers directory...
                  </td>
                </tr>
              ) : filteredOfficers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-muted">
                    No police officers found.
                  </td>
                </tr>
              ) : (
                filteredOfficers.map((off) => {
                  const isSuperAdmin = off.username === "SPMalegaon" || off.role === "SuperAdmin";
                  return (
                    <tr key={off.id}>
                      <td>
                        <b>{off.full_name}</b>
                        <br />
                        <small className="text-muted">{off.email || off.mobile || "-"}</small>
                      </td>
                      <td><code>{off.username}</code></td>
                      <td>{off.police_station_name || "Malegaon Police Headquarters"}</td>
                      <td>
                        <span className={`role-badge ${off.role?.toLowerCase()}`}>
                          {off.role}
                        </span>
                      </td>
                      <td>
                        <span className={`scope-badge ${off.access_scope?.toLowerCase() || "own"}`}>
                          {off.access_scope || "OWN"}
                        </span>
                      </td>
                      <td>{off.designation || "Constable"}</td>
                      <td>
                        <span className={`status-pill ${off.status?.toLowerCase()}`}>
                          {off.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions-row">
                          <button
                            type="button"
                            className="icon-action-btn"
                            title="Edit Officer Profile"
                            onClick={() => handleOpenEdit(off)}
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn amber"
                            title="Reset Password"
                            onClick={() => setResetModalOfficer(off)}
                          >
                            <KeyRound size={15} />
                          </button>

                          {!isSuperAdmin && (
                            <>
                              <button
                                type="button"
                                className={`icon-action-btn ${off.status === "Active" ? "amber" : "green"}`}
                                title={off.status === "Active" ? "Deactivate Officer" : "Activate Officer"}
                                onClick={() => handleToggleStatus(off)}
                              >
                                {off.status === "Active" ? <UserX size={15} /> : <UserCheck size={15} />}
                              </button>

                              <button
                                type="button"
                                className="icon-action-btn red"
                                title="Delete Officer Permanently"
                                onClick={() => handleDeleteOfficer(off)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT OFFICER MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="admin-modal-card">
            <div className="modal-header">
              <h3>{editingOfficer ? "Edit Officer Profile" : "Add New Police Officer"}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="admin-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Inspector Ramesh Patil"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="e.g. 9822012345"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="e.g. 35"
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="officer@pcms.gov.in"
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Police Station</label>
                  <select
                    name="police_station_name"
                    value={formData.police_station_name}
                    onChange={handleInputChange}
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={st.station_name}>
                        {st.station_name}
                      </option>
                    ))}
                    <option value="Malegaon Police Headquarters">Malegaon Police Headquarters</option>
                    <option value="Chhavani Police Station">Chhavani Police Station</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="e.g. Constable / Sub Inspector"
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="Officer">Officer</option>
                    <option value="HeadOfficer">Head Officer</option>
                    <option value="SuperAdmin">Super Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Data Access Scope</label>
                  <select
                    name="access_scope"
                    value={formData.access_scope}
                    onChange={handleInputChange}
                  >
                    <option value="OWN">OWN (Created Records Only)</option>
                    <option value="TEAM">TEAM (Squad Shared Records)</option>
                    <option value="ALL">ALL (Complete City Records)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="e.g. officer_ramesh"
                    required
                    disabled={Boolean(editingOfficer)}
                  />
                </div>

                {!editingOfficer && (
                  <>
                    <div className="form-group">
                      <label>Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password..."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm Password *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm password..."
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {editingOfficer ? "Update Officer Profile" : "Create Officer Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalOfficer && (
        <div className="modal-overlay">
          <div className="admin-modal-card">
            <div className="modal-header">
              <h3>Reset Password: {resetModalOfficer.full_name}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setResetModalOfficer(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="admin-form">
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  required
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setResetModalOfficer(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfficersManagement;
