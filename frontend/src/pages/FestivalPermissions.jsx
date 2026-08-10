import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Download,
  Calendar,
  Plus,
  X,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Clock,
  XCircle,
  Volume2,
  Route,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getFestivalPermissions,
  deleteFestivalPermission,
} from "../api/festivalApi";
import VoiceField from "../components/common/VoiceField";
import RecordDetailsModal from "../components/common/RecordDetailsModal";

const getUploadedPhotoUrl = (photo) => {
  if (!photo) return "";
  const photoValue = String(photo);

  if (
    photoValue.startsWith("http://") ||
    photoValue.startsWith("https://") ||
    photoValue.startsWith("blob:") ||
    photoValue.startsWith("data:")
  ) {
    return photoValue;
  }

  const backendBase = (import.meta.env.VITE_API_URL || "").replace(
    /\/api\/?$/,
    ""
  );
  const cleanPhoto = photoValue.replace(/^\/+/, "").replace(/^uploads\//, "");
  return `${backendBase}/uploads/${cleanPhoto}`;
};

function FestivalPermissions() {
  const navigate = useNavigate();

  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFestival, setSelectedFestival] = useState(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await getFestivalPermissions();
      setPermissions(res.data.data || []);
    } catch (error) {
      console.error("Festival permissions error:", error);
      toast.error("Failed to load festival permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (!selectedFestival) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setSelectedFestival(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedFestival]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this festival permission permanently?")) return;

    try {
      await deleteFestivalPermission(id);
      toast.success("Permission deleted successfully");

      if (selectedFestival?.id === id) {
        setSelectedFestival(null);
      }

      fetchPermissions();
    } catch (error) {
      console.error("Festival delete error:", error);
      toast.error("Failed to delete permission");
    }
  };

  const filteredPermissions = useMemo(() => {
    return permissions.filter((item) => {
      const q = searchText.toLowerCase().trim();

      const matchesSearch =
        !q ||
        item.festival_name?.toLowerCase().includes(q) ||
        item.organizer_name?.toLowerCase().includes(q) ||
        item.mandal_name?.toLowerCase().includes(q) ||
        item.president_name?.toLowerCase().includes(q) ||
        String(item.president_mobile || "").includes(q);

      const status = (item.permission_status || "Pending").toLowerCase();
      const matchesStatus =
        statusFilter === "all" || status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [permissions, searchText, statusFilter]);

  const getStatusBadge = (statusStr) => {
    const status = (statusStr || "Pending").toUpperCase();
    switch (status) {
      case "APPROVED":
        return (
          <span className="status-badge approved" style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
            <CheckCircle size={13} style={{ marginRight: 4, display: "inline-block" }} />
            Approved
          </span>
        );
      case "REJECTED":
      case "CANCELLED":
      case "EXPIRED":
        return (
          <span className="status-badge rejected" style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
            <XCircle size={13} style={{ marginRight: 4, display: "inline-block" }} />
            {status}
          </span>
        );
      case "COMPLETED":
        return (
          <span className="status-badge completed" style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
            <CheckCircle size={13} style={{ marginRight: 4, display: "inline-block" }} />
            Completed
          </span>
        );
      default:
        return (
          <span className="status-badge pending" style={{ background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
            <Clock size={13} style={{ marginRight: 4, display: "inline-block" }} />
            Pending
          </span>
        );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Festival Permission Database</h2>
          <p className="page-subtitle">
            Live festival permissions, mandal registrations and procession permits.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="secondary-btn"
            type="button"
            onClick={() => toast.success("Exporting Excel file...")}
          >
            <Download size={18} />
            Export Excel
          </button>

          <button
            className="primary-btn"
            type="button"
            onClick={() => navigate("/add-festival-permission")}
          >
            <Plus size={18} />
            Add Festival Permission
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={18} />
          <VoiceField
            name="searchText"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search festival, mandal, adhyaksha, phone..."
          />
        </div>

        <select
          className="dashboard-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: "160px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
        >
          <option value="all">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="data-table-card">
        <div className="table-responsive">
          <table className="professional-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Festival & Mandal</th>
                <th>Adhyaksha / President</th>
                <th>Mobile</th>
                <th>Procession</th>
                <th>Sound</th>
                <th>Crowd</th>
                <th>Risk Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10">Loading festival permissions...</td>
                </tr>
              ) : filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan="10">No festival permissions found.</td>
                </tr>
              ) : (
                filteredPermissions.map((item) => {
                  const photoUrl = getUploadedPhotoUrl(
                    item.photo_url || item.photo || item.image
                  );

                  return (
                    <tr key={item.id}>
                      <td>
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={item.festival_name}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div className="place-icon">
                            <Calendar size={18} />
                          </div>
                        )}
                      </td>

                      <td>
                        <b>{item.festival_name || "Festival"}</b>
                        <p>{item.organizer_name || item.mandal_name || "-"}</p>
                      </td>

                      <td>{item.president_name || "-"}</td>
                      <td>{item.president_mobile || item.mobile || "-"}</td>

                      <td>
                        {item.procession || item.procession_permission ? (
                          <span style={{ color: "#166534", fontWeight: 600 }}>Yes</span>
                        ) : (
                          <span style={{ color: "#64748b" }}>No</span>
                        )}
                      </td>

                      <td>
                        {item.sound_permission ? (
                          <span style={{ color: "#166534", fontWeight: 600 }}>Yes</span>
                        ) : (
                          <span style={{ color: "#64748b" }}>No</span>
                        )}
                      </td>

                      <td>{item.expected_crowd || "-"}</td>

                      <td>
                        <span
                          className={`risk-badge ${(
                            item.risk_level || "low"
                          ).toLowerCase()}`}
                        >
                          {item.risk_level || "Low"}
                        </span>
                      </td>

                      <td>{getStatusBadge(item.permission_status)}</td>

                      <td>
                        <div className="action-group">
                          <button
                            type="button"
                            title="View Details"
                            onClick={() => setSelectedFestival(item)}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            title="Edit Permission"
                            onClick={() =>
                              navigate(`/edit-festival-permission/${item.id}`)
                            }
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title="Delete Permission"
                            className="danger-action"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
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

      <div className="pagination-row">
        <p>Showing {filteredPermissions.length} live festival records</p>
      </div>

      {/* UNIVERSAL RECORD DETAILS MODAL */}
      <RecordDetailsModal
        record={selectedFestival ? { ...selectedFestival, recordType: "Festival Mandal" } : null}
        onClose={() => setSelectedFestival(null)}
        onEdit={(item) => navigate(`/edit-festival-permission/${item.id}`)}
      />
    </div>
  );
}

export default FestivalPermissions;