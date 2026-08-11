import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  MapPin,
  CalendarCheck,
  Building,
  Layers,
  FileCheck,
  UserPlus,
  Sliders,
  CopyCheck,
  FileText,
  Search,
  Eye,
  Database,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

import { getOfficers } from "../../api/officerApi";
import { getTeams } from "../../api/teamsApi";
import { getReligiousPlaces } from "../../api/religiousPlaceApi";
import { getFestivalPermissions } from "../../api/festivalApi";
import { getOtherPlaces } from "../../api/otherPlaceApi";
import { useAdminAuth } from "../../context/AdminAuthContext";
import RecordDetailsModal from "../../components/common/RecordDetailsModal";
import "./AdminPortal.css";

function AdminDashboard() {
  const { adminUser } = useAdminAuth();
  const [officers, setOfficers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [religiousPlaces, setReligiousPlaces] = useState([]);
  const [festivalPermissions, setFestivalPermissions] = useState([]);
  const [otherPlaces, setOtherPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        getOfficers(),
        getTeams(),
        getReligiousPlaces(),
        getFestivalPermissions(),
        getOtherPlaces(),
      ]);

      if (results[0].status === "fulfilled") {
        setOfficers(results[0].value.data?.data || []);
      }
      if (results[1].status === "fulfilled") {
        setTeams(results[1].value.data?.data || []);
      }
      if (results[2].status === "fulfilled") {
        setReligiousPlaces(results[2].value.data?.data || []);
      }
      if (results[3].status === "fulfilled") {
        setFestivalPermissions(results[3].value.data?.data || []);
      }
      if (results[4].status === "fulfilled") {
        setOtherPlaces(results[4].value.data?.data || []);
      }
    } catch (err) {
      console.error("Admin dashboard load error:", err);
      toast.error("Failed to load administration metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const officerMap = new Map(officers.map((o) => [o.id, o.full_name || o.username]));

  const getOfficerName = (createdById) => {
    if (!createdById) return "Super Admin";
    return officerMap.get(createdById) || "Registered Officer";
  };

  const activeOfficers = officers.filter((o) => o.status === "Active");
  const totalRecords = religiousPlaces.length + festivalPermissions.length + otherPlaces.length;

  const combinedRecords = [
    ...religiousPlaces.map((item) => ({
      ...item,
      recordCategory: "places",
      categoryLabel: "Religious Place",
      categoryColor: "teal",
      name: item.place_name,
      subtitle: `${item.place_type || "-"} • ${item.area || "-"}`,
      creatorName: getOfficerName(item.created_by),
      status: item.risk_level || "Low",
      statusType: "risk",
      date: item.created_at ? new Date(item.created_at).toLocaleDateString() : "-",
      raw: item,
    })),
    ...festivalPermissions.map((item) => ({
      ...item,
      recordCategory: "festivals",
      categoryLabel: "Festival Permit",
      categoryColor: "amber",
      name: item.organizer_name || item.festival_name || item.president_name || "Festival Permit",
      subtitle: `${item.festival_name || "-"} • ${item.area || "-"}`,
      creatorName: getOfficerName(item.created_by || item.assigned_officer),
      status: item.permission_status || "Pending",
      statusType: "permission",
      date: item.start_date || (item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"),
      raw: item,
    })),
    ...otherPlaces.map((item) => ({
      ...item,
      recordCategory: "other",
      categoryLabel: "Other Place",
      categoryColor: "emerald",
      name: item.place_name,
      subtitle: `${item.category || "-"} • ${item.area || "-"}`,
      creatorName: getOfficerName(item.created_by),
      status: item.category || "General",
      statusType: "category",
      date: item.created_at ? new Date(item.created_at).toLocaleDateString() : "-",
      raw: item,
    })),
  ];

  const filteredRecords = combinedRecords.filter((record) => {
    if (activeTab !== "all" && record.recordCategory !== activeTab) {
      return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      record.name?.toLowerCase().includes(q) ||
      record.subtitle?.toLowerCase().includes(q) ||
      record.creatorName?.toLowerCase().includes(q) ||
      record.area?.toLowerCase().includes(q)
    );
  });

  const openRecordModal = (record) => {
    setSelectedRecord({
      ...record.raw,
      recordType: record.categoryLabel,
      title: record.name,
      subtitle: record.subtitle,
    });
  };

  return (
    <div className="admin-page-container">
      {/* WELCOME / OVERVIEW BANNER */}
      <div className="admin-welcome-banner">
        <div>
          <h2>मालेगाव शहर पोलीस व्यवस्थापन</h2>
          <p>
            Welcome, <b>{adminUser?.full_name || "Superintendent of Police"}</b>. System Administration & Command Console.
          </p>
        </div>
        <span className="admin-authority-chip">
          <ShieldCheck size={15} />
          Super Admin Authority
        </span>
      </div>

      {/* CORE POLICE & PERSONNEL METRICS */}
      <div className="admin-section-block">
        <div className="section-title-sm">
          <span>POLICE PERSONNEL & SQUADS</span>
        </div>
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card blue">
            <Users size={24} />
            <div>
              <h3>{loading ? "..." : officers.length}</h3>
              <span>Total Police Officers</span>
            </div>
          </div>

          <div className="admin-kpi-card teal">
            <ShieldCheck size={24} />
            <div>
              <h3>{loading ? "..." : activeOfficers.length}</h3>
              <span>Active Personnel</span>
            </div>
          </div>

          <div className="admin-kpi-card purple">
            <Layers size={24} />
            <div>
              <h3>{loading ? "..." : teams.length}</h3>
              <span>Squad Teams</span>
            </div>
          </div>

          <div className="admin-kpi-card blue">
            <FileCheck size={24} />
            <div>
              <h3>{loading ? "..." : totalRecords}</h3>
              <span>Total Master Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADMINISTRATIVE QUICK ACTIONS */}
      <div className="admin-section-block">
        <div className="section-title-sm">
          <span>ADMINISTRATIVE QUICK ACTIONS</span>
        </div>
        <div className="quick-actions-grid">
          <Link to="/admin/officers" className="quick-action-pill">
            <UserPlus size={16} className="text-sky" />
            <span>Add Police Officer</span>
          </Link>

          <Link to="/admin/officers" className="quick-action-pill">
            <Users size={16} className="text-teal" />
            <span>Officer Directory</span>
          </Link>

          <Link to="/admin/teams" className="quick-action-pill">
            <Layers size={16} className="text-purple" />
            <span>Teams & Sharing</span>
          </Link>

          <Link to="/admin/access-control" className="quick-action-pill">
            <Sliders size={16} className="text-amber" />
            <span>Access Control</span>
          </Link>

          <Link to="/admin/duplicate-review" className="quick-action-pill">
            <CopyCheck size={16} className="text-emerald" />
            <span>Duplicate Review</span>
          </Link>

          <Link to="/admin/audit-logs" className="quick-action-pill">
            <FileText size={16} className="text-rose" />
            <span>System Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* CITY MASTER RECORDS STATISTICS */}
      <div className="admin-section-block">
        <div className="section-title-sm">
          <span>CITY MASTER RECORDS STATISTICS</span>
        </div>
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card teal">
            <MapPin size={24} />
            <div>
              <h3>{loading ? "..." : religiousPlaces.length}</h3>
              <span>Religious Places</span>
            </div>
          </div>

          <div className="admin-kpi-card amber">
            <CalendarCheck size={24} />
            <div>
              <h3>{loading ? "..." : festivalPermissions.length}</h3>
              <span>Festival Permits</span>
            </div>
          </div>

          <div className="admin-kpi-card emerald">
            <Building size={24} />
            <div>
              <h3>{loading ? "..." : otherPlaces.length}</h3>
              <span>Other Places</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUPER ADMIN GLOBAL DATA VISIBILITY SECTION */}
      <div className="admin-section-block">
        <div className="section-title-sm">
          <Database size={16} />
          <span>ALL REGISTERED CITY DATA (GLOBAL OFFICER DATA STREAM)</span>
        </div>

        <div className="admin-data-filter-bar">
          <div className="admin-tab-buttons">
            <button
              type="button"
              className={activeTab === "all" ? "active" : ""}
              onClick={() => setActiveTab("all")}
            >
              All ({totalRecords})
            </button>
            <button
              type="button"
              className={activeTab === "places" ? "active" : ""}
              onClick={() => setActiveTab("places")}
            >
              Religious Places ({religiousPlaces.length})
            </button>
            <button
              type="button"
              className={activeTab === "festivals" ? "active" : ""}
              onClick={() => setActiveTab("festivals")}
            >
              Festival Permits ({festivalPermissions.length})
            </button>
            <button
              type="button"
              className={activeTab === "other" ? "active" : ""}
              onClick={() => setActiveTab("other")}
            >
              Other Places ({otherPlaces.length})
            </button>
          </div>

          <div className="admin-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, officer, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Name / Mandal</th>
                <th>Sub-details / Area</th>
                <th>Created By Officer</th>
                <th>Status / Risk</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    Loading global registered data...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    No registered records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr key={`admin-rec-${idx}`}>
                    <td>
                      <span className={`admin-cat-pill ${rec.categoryColor}`}>
                        {rec.categoryLabel}
                      </span>
                    </td>
                    <td className="font-semibold">{rec.name}</td>
                    <td>{rec.subtitle}</td>
                    <td>
                      <span className="officer-name-tag">👤 {rec.creatorName}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${rec.status.toLowerCase()}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>{rec.date}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-view-btn"
                        onClick={() => openRecordModal(rec)}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && (
        <RecordDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
