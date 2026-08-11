import { useEffect, useState } from "react";
import {
  Sliders,
  Shield,
  Users,
  Lock,
  Search,
  CheckCircle,
  AlertCircle,
  Eye,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { getOfficers, updateOfficer } from "../../api/officerApi";

function AccessControl() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");

  const loadOfficers = async () => {
    try {
      setLoading(true);
      const res = await getOfficers();
      setOfficers(res.data.data || []);
    } catch (err) {
      console.error("Access control load error:", err);
      toast.error("Failed to load access scope matrix");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfficers();
  }, []);

  const handleScopeChange = async (officer, newScope) => {
    if (officer.username === "SPMalegaon" || officer.role === "SuperAdmin") {
      toast.error("Super Admin scope cannot be downgraded from ALL");
      return;
    }

    try {
      await updateOfficer(officer.id, { access_scope: newScope });
      toast.success(`Access scope for ${officer.full_name} set to ${newScope}`);
      setOfficers((prev) =>
        prev.map((o) => (o.id === officer.id ? { ...o, access_scope: newScope } : o))
      );
    } catch (err) {
      console.error("Scope update error:", err);
      toast.error("Failed to update access scope");
    }
  };

  const handleRoleChange = async (officer, newRole) => {
    if (officer.username === "SPMalegaon" || officer.role === "SuperAdmin") {
      toast.error("Super Admin role cannot be modified");
      return;
    }

    try {
      await updateOfficer(officer.id, { role: newRole });
      toast.success(`Role for ${officer.full_name} set to ${newRole}`);
      setOfficers((prev) =>
        prev.map((o) => (o.id === officer.id ? { ...o, role: newRole } : o))
      );
    } catch (err) {
      console.error("Role update error:", err);

      toast.error("Failed to update officer role");
    }
  };

  const filteredOfficers = officers.filter((off) => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch =
      !q ||
      off.full_name?.toLowerCase().includes(q) ||
      off.username?.toLowerCase().includes(q) ||
      off.designation?.toLowerCase().includes(q) ||
      off.police_station_name?.toLowerCase().includes(q);

    const matchRole = roleFilter === "ALL" || off.role === roleFilter;
    const matchScope = scopeFilter === "ALL" || off.access_scope === scopeFilter;

    return nameMatch && matchRole && matchScope;
  });

  return (
    <div className="admin-page-container">
      {/* HEADER ROW */}
      <div className="admin-header-row">
        <div>
          <h2>Data Access Control & Role Matrix</h2>
          <p>Manage personnel authorization, system roles, and record visibility scopes (OWN, TEAM, ALL)</p>
        </div>
      </div>

      {/* ACCESS HIERARCHY EXPLAINER CARDS */}
      <div className="scope-card-grid">
        <div className="scope-card own">
          <div className="scope-card-header">
            <Lock size={18} className="text-amber" />
            <div>
              <h4>OWN Scope</h4>
              <span>Private Officer Records</span>
            </div>
          </div>
          <p>
            Officer sees only self-registered religious places, festival permits, and location entries. Ideal for field constables.
          </p>
        </div>

        <div className="scope-card team">
          <div className="scope-card-header">
            <Users size={18} className="text-teal" />
            <div>
              <h4>TEAM Scope</h4>
              <span>Squad Shared Records</span>
            </div>
          </div>
          <p>
            Officer views records created by squad teammates when Team Sharing is enabled. Promotes collaborative patrolling.
          </p>
        </div>

        <div className="scope-card all">
          <div className="scope-card-header">
            <Shield size={18} className="text-green" />
            <div>
              <h4>ALL Scope</h4>
              <span>City-Wide Access</span>
            </div>
          </div>
          <p>
            Head Officer and Super Admin monitor all city locations, police station records, duplicate reviews, and system logs.
          </p>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="admin-toolbar-card">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="admin-search-box flex-1 min-w-[260px]">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search personnel by name, username, designation, station..."
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted font-semibold">Role:</label>
            <select
              className="admin-select-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="Officer">Officer</option>
              <option value="HeadOfficer">Head Officer</option>
              <option value="SuperAdmin">Super Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted font-semibold">Access Scope:</label>
            <select
              className="admin-select-sm"
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
            >
              <option value="ALL">All Scopes</option>
              <option value="OWN">OWN Only</option>
              <option value="TEAM">TEAM Shared</option>
              <option value="ALL">ALL City Records</option>
            </select>
          </div>
        </div>
      </div>

      {/* PERSONNEL ACCESS MATRIX TABLE */}
      <div className="admin-table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Personnel Officer</th>
                <th>Username</th>
                <th>Station</th>
                <th>Current Role</th>
                <th>Data Access Scope</th>
                <th>Scope Description & Permissions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-muted">
                    Loading access scope matrix...
                  </td>
                </tr>
              ) : filteredOfficers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-muted">
                    No personnel found matching filter criteria.
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
                        <small className="text-muted">{off.designation || "Constable"}</small>
                      </td>
                      <td><code>{off.username}</code></td>
                      <td>{off.police_station_name || "Chhavani Police Station"}</td>
                      <td>
                        {isSuperAdmin ? (
                          <span className="role-badge superadmin">
                            <Lock size={12} /> Super Admin
                          </span>
                        ) : (
                          <select
                            className="admin-select-sm"
                            value={off.role || "Officer"}
                            onChange={(e) => handleRoleChange(off, e.target.value)}
                          >
                            <option value="Officer">Officer</option>
                            <option value="HeadOfficer">Head Officer</option>
                            <option value="SuperAdmin">Super Admin</option>
                          </select>
                        )}
                      </td>
                      <td>
                        {isSuperAdmin ? (
                          <span className="scope-badge all">
                            <Shield size={12} /> ALL (City Wide)
                          </span>
                        ) : (
                          <select
                            className="admin-select-sm"
                            value={off.access_scope || "OWN"}
                            onChange={(e) => handleScopeChange(off, e.target.value)}
                          >
                            <option value="OWN">OWN Records Only</option>
                            <option value="TEAM">TEAM Shared Records</option>
                            <option value="ALL">ALL City Records</option>
                          </select>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {off.access_scope === "ALL" || isSuperAdmin
                            ? "Full visibility: Can view & monitor all city locations, maps & reports"
                            : off.access_scope === "TEAM"
                              ? "Squad visibility: Can view records created by own team squad"
                              : "Private visibility: Can view only self-created private records"}
                        </small>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AccessControl;
