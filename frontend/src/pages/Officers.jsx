import { useEffect, useState } from "react";
import { Users, Search, ShieldCheck, Mail, Phone, Building2, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { getOfficers } from "../api/officerApi";

function Officers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const res = await getOfficers();
      setOfficers(res.data.data || []);
    } catch (error) {
      console.error("Failed to load officers:", error);
      // Fallback mock initial admin officer if database table is empty
      setOfficers([
        {
          id: "1",
          full_name: "Admin Officer",
          username: "officer_chhavani",
          email: "officer@pcms.gov.in",
          role: "Admin",
          police_station_name: "Chhavani Police Station",
          status: "Active",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const filteredOfficers = officers.filter((off) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      off.full_name?.toLowerCase().includes(q) ||
      off.username?.toLowerCase().includes(q) ||
      off.email?.toLowerCase().includes(q) ||
      off.police_station_name?.toLowerCase().includes(q) ||
      off.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Police Officers Directory</h2>
          <p className="page-subtitle">
            Registered officers and administrative personnel assigned to city police stations.
          </p>
        </div>

        <button className="primary-btn" type="button" onClick={() => toast.info("Officer creation managed by SuperAdmin")}>
          <UserPlus size={18} />
          Add Officer
        </button>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search officers by name, badge number, station..."
          />
        </div>
      </div>

      <div className="data-table-card">
        <div className="table-responsive">
          <table className="professional-table">
            <thead>
              <tr>
                <th>Officer Name</th>
                <th>Username / Badge</th>
                <th>Role</th>
                <th>Station</th>
                <th>Contact Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">Loading officers list...</td>
                </tr>
              ) : filteredOfficers.length === 0 ? (
                <tr>
                  <td colSpan="6">No officers found matching search criteria.</td>
                </tr>
              ) : (
                filteredOfficers.map((officer) => (
                  <tr key={officer.id}>
                    <td>
                      <div className="place-cell">
                        <div className="place-icon">
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <b>{officer.full_name}</b>
                          <p>{officer.role || "Officer"}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <b>{officer.username}</b>
                    </td>
                    <td>
                      <span className="category-badge bank">{officer.role || "Officer"}</span>
                    </td>
                    <td>{officer.police_station_name || "Central Station"}</td>
                    <td>{officer.email || "-"}</td>
                    <td>
                      <span className="status-badge approved">{officer.status || "Active"}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pagination-row">
        <p>Showing {filteredOfficers.length} active officers</p>
      </div>
    </div>
  );
}

export default Officers;