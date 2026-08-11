import { useEffect, useState, useMemo } from "react";
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
  RefreshCcw,
  CheckCircle2,
  Clock,
  Activity,
  XCircle,
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
  const [errorState, setErrorState] = useState(false);

  // Filters state
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState("all");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorState(false);

      const results = await Promise.allSettled([
        getOfficers(),
        getTeams(),
        getReligiousPlaces(),
        getFestivalPermissions(),
        getOtherPlaces(),
      ]);

      let hasSuccess = false;

      if (results[0].status === "fulfilled") {
        setOfficers(results[0].value.data?.data || []);
        hasSuccess = true;
      }
      if (results[1].status === "fulfilled") {
        setTeams(results[1].value.data?.data || []);
        hasSuccess = true;
      }
      if (results[2].status === "fulfilled") {
        setReligiousPlaces(results[2].value.data?.data || []);
        hasSuccess = true;
      }
      if (results[3].status === "fulfilled") {
        setFestivalPermissions(results[3].value.data?.data || []);
        hasSuccess = true;
      }
      if (results[4].status === "fulfilled") {
        setOtherPlaces(results[4].value.data?.data || []);
        hasSuccess = true;
      }

      if (!hasSuccess) {
        setErrorState(true);
      }
    } catch (err) {
      console.error("Admin dashboard load error:", err);
      setErrorState(true);
      toast.error("Unable to load administration records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const officerMap = useMemo(() => {
    return new Map(officers.map((o) => [o.id, o.full_name || o.username]));
  }, [officers]);

  const getOfficerName = (createdById) => {
    if (!createdById) return "Super Admin";
    return officerMap.get(createdById) || "Registered Officer";
  };

  const activeOfficers = officers.filter((o) => o.status === "Active");
  const totalRecords = religiousPlaces.length + festivalPermissions.length + otherPlaces.length;

  const combinedRecords = useMemo(() => {
    return [
      ...religiousPlaces.map((item) => ({
        ...item,
        recordCategory: "places",
        categoryLabel: "Religious Place",
        categoryColor: "teal",
        name: item.place_name,
        subtitle: `${item.place_type || "-"} • ${item.area || "-"}`,
        creatorId: item.created_by,
        creatorName: getOfficerName(item.created_by),
        status: item.risk_level || "Low",
        statusType: "risk",
        date: item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-",
        rawDate: item.created_at ? new Date(item.created_at).getTime() : 0,
        raw: item,
      })),
      ...festivalPermissions.map((item) => ({
        ...item,
        recordCategory: "festivals",
        categoryLabel: "Festival Permit",
        categoryColor: "amber",
        name: item.organizer_name || item.festival_name || item.president_name || "Festival Permit",
        subtitle: `${item.festival_name || "-"} • ${item.area || "-"}`,
        creatorId: item.created_by || item.assigned_officer,
        creatorName: getOfficerName(item.created_by || item.assigned_officer),
        status: item.permission_status || "Pending",
        statusType: "permission",
        date: item.start_date || (item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"),
        rawDate: item.created_at ? new Date(item.created_at).getTime() : 0,
        raw: item,
      })),
      ...otherPlaces.map((item) => ({
        ...item,
        recordCategory: "other",
        categoryLabel: "Other Place",
        categoryColor: "emerald",
        name: item.place_name,
        subtitle: `${item.category || "-"} • ${item.area || "-"}`,
        creatorId: item.created_by,
        creatorName: getOfficerName(item.created_by),
        status: item.category || "General",
        statusType: "category",
        date: item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-",
        rawDate: item.created_at ? new Date(item.created_at).getTime() : 0,
        raw: item,
      })),
    ].sort((a, b) => b.rawDate - a.rawDate);
  }, [religiousPlaces, festivalPermissions, otherPlaces, officerMap]);

  // Recent registrations (Top 5)
  const recentRegistrations = useMemo(() => {
    return combinedRecords.slice(0, 5);
  }, [combinedRecords]);

  // Filtered records for master table
  const filteredRecords = useMemo(() => {
    return combinedRecords.filter((record) => {
      if (activeTab !== "all" && record.recordCategory !== activeTab) {
        return false;
      }
      if (selectedOfficerFilter !== "all" && record.creatorId !== selectedOfficerFilter) {
        return false;
      }
      if (selectedRiskFilter !== "all") {
        if (record.status?.toLowerCase() !== selectedRiskFilter.toLowerCase()) {
          return false;
        }
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
  }, [combinedRecords, activeTab, selectedOfficerFilter, selectedRiskFilter, searchQuery]);

  const clearFilters = () => {
    setActiveTab("all");
    setSearchQuery("");
    setSelectedOfficerFilter("all");
    setSelectedRiskFilter("all");
  };

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
      {/* 1. DASHBOARD HEADER */}
      <div className="admin-command-header">
        <div className="header-brand-meta">
          <span className="gov-badge">MALEGAON CITY POLICE ADMINISTRATION</span>
          <h2>Super Admin Command Center</h2>
          <p>System-wide operational monitoring & centralized data management console</p>
        </div>
        <div className="header-status-group">
          <span className="status-indicator-pill live">
            <span className="pulse-dot"></span>
            System Operational
          </span>
          <span className="authority-role-pill">
            <ShieldCheck size={14} />
            Super Admin
          </span>
        </div>
      </div>

      {/* ERROR STATE RETRY BAR */}
      {errorState && (
        <div className="admin-error-banner">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-rose-400" />
            <span>Unable to load latest database records. Please verify network connectivity.</span>
          </div>
          <button type="button" onClick={loadData} className="retry-btn">
            <RefreshCcw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* 2. PRIMARY SYSTEM OVERVIEW (KPI CARDS) */}
      <div className="admin-section-wrapper">
        <div className="section-header-compact">
          <Activity size={16} className="text-sky" />
          <span>SYSTEM OVERVIEW</span>
        </div>

        <div className="kpi-command-grid">
          <div className="kpi-command-card sky">
            <div className="kpi-header-row">
              <span className="kpi-icon-box"><Users size={20} /></span>
              <span className="kpi-trend">Personnel</span>
            </div>
            <div className="kpi-body">
              <h3>{loading ? <span className="kpi-skeleton"></span> : officers.length}</h3>
              <span className="kpi-label">Total Officers</span>
              <p className="kpi-desc">Police personnel registered</p>
            </div>
          </div>

          <div className="kpi-command-card teal">
            <div className="kpi-header-row">
              <span className="kpi-icon-box"><ShieldCheck size={20} /></span>
              <span className="kpi-trend active">Active</span>
            </div>
            <div className="kpi-body">
              <h3>{loading ? <span className="kpi-skeleton"></span> : activeOfficers.length}</h3>
              <span className="kpi-label">Active Personnel</span>
              <p className="kpi-desc">Officers actively logging in</p>
            </div>
          </div>

          <div className="kpi-command-card cyan">
            <div className="kpi-header-row">
              <span className="kpi-icon-box"><MapPin size={20} /></span>
              <span className="kpi-trend">Locations</span>
            </div>
            <div className="kpi-body">
              <h3>{loading ? <span className="kpi-skeleton"></span> : religiousPlaces.length}</h3>
              <span className="kpi-label">Religious Places</span>
              <p className="kpi-desc">Registered temples, mosques, etc.</p>
            </div>
          </div>

          <div className="kpi-command-card amber">
            <div className="kpi-header-row">
              <span className="kpi-icon-box"><CalendarCheck size={20} /></span>
              <span className="kpi-trend">Events</span>
            </div>
            <div className="kpi-body">
              <h3>{loading ? <span className="kpi-skeleton"></span> : festivalPermissions.length}</h3>
              <span className="kpi-label">Festival Permits</span>
              <p className="kpi-desc">Mandal & procession permits</p>
            </div>
          </div>

          <div className="kpi-command-card emerald">
            <div className="kpi-header-row">
              <span className="kpi-icon-box"><Building size={20} /></span>
              <span className="kpi-trend">Civic</span>
            </div>
            <div className="kpi-body">
              <h3>{loading ? <span className="kpi-skeleton"></span> : otherPlaces.length}</h3>
              <span className="kpi-label">Other Places</span>
              <p className="kpi-desc">Commercial & sensitive spots</p>
            </div>
          </div>

          <div className="kpi-command-card purple highlighted">
            <div className="kpi-header-row">
              <span className="kpi-icon-box"><Database size={20} /></span>
              <span className="kpi-trend master">Master DB</span>
            </div>
            <div className="kpi-body">
              <h3>{loading ? <span className="kpi-skeleton"></span> : totalRecords}</h3>
              <span className="kpi-label">Total Registered Records</span>
              <p className="kpi-desc">Total city data points monitored</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CITY RECORDS BREAKDOWN */}
      <div className="admin-section-wrapper">
        <div className="section-header-compact">
          <FileCheck size={16} className="text-teal" />
          <span>CITY RECORDS BREAKDOWN</span>
        </div>

        <div className="city-records-summary-grid">
          <div className="breakdown-card">
            <div className="breakdown-accent teal"></div>
            <div className="breakdown-info">
              <span className="breakdown-type">Religious Places</span>
              <h4>{loading ? "..." : religiousPlaces.length}</h4>
              <p>Registered religious locations across all police station limits</p>
            </div>
          </div>

          <div className="breakdown-card">
            <div className="breakdown-accent amber"></div>
            <div className="breakdown-info">
              <span className="breakdown-type">Festival Permissions</span>
              <h4>{loading ? "..." : festivalPermissions.length}</h4>
              <p>Approved & pending festival mandal permits</p>
            </div>
          </div>

          <div className="breakdown-card">
            <div className="breakdown-accent emerald"></div>
            <div className="breakdown-info">
              <span className="breakdown-type">Other Places</span>
              <h4>{loading ? "..." : otherPlaces.length}</h4>
              <p>Other civic, commercial & sensitive data points</p>
            </div>
          </div>

          <div className="breakdown-total-banner">
            <div>
              <span>TOTAL CITY MASTER RECORDS</span>
              <h3>{loading ? "..." : totalRecords}</h3>
            </div>
            <Database size={28} className="text-sky opacity-80" />
          </div>
        </div>
      </div>

      {/* 4. RECENT REGISTRATIONS (RECENT ACTIVITY) */}
      <div className="admin-section-wrapper">
        <div className="section-header-compact space-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber" />
            <span>RECENT REGISTRATIONS</span>
          </div>
          <button
            type="button"
            className="link-btn-sm"
            onClick={() => {
              const el = document.getElementById("all-records-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            View All Records ({totalRecords}) →
          </button>
        </div>

        {loading ? (
          <div className="recent-grid-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="recent-card-skeleton"></div>
            ))}
          </div>
        ) : recentRegistrations.length === 0 ? (
          <div className="empty-state-box">
            <p>No recent registrations submitted yet.</p>
          </div>
        ) : (
          <div className="recent-activity-grid">
            {recentRegistrations.map((rec, idx) => (
              <div key={`recent-${idx}`} className="recent-activity-card">
                <div className="recent-card-top">
                  <span className={`admin-cat-pill ${rec.categoryColor}`}>
                    {rec.categoryLabel}
                  </span>
                  <span className="recent-date">📅 {rec.date}</span>
                </div>
                <h4 className="recent-title">{rec.name}</h4>
                <p className="recent-subtitle">{rec.subtitle}</p>

                <div className="recent-card-footer">
                  <span className="officer-name-tag">👤 {rec.creatorName}</span>
                  <button
                    type="button"
                    className="admin-view-btn-sm"
                    onClick={() => openRecordModal(rec)}
                  >
                    <Eye size={13} />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. ALL REGISTERED RECORDS (MASTER TABLE WITH FILTERS) */}
      <div className="admin-section-wrapper" id="all-records-section">
        <div className="section-header-compact">
          <Database size={16} className="text-sky" />
          <div>
            <span className="section-main-title">ALL REGISTERED RECORDS</span>
            <p className="section-sub-title">View and manage records submitted by all officers.</p>
          </div>
        </div>

        {/* 6. CATEGORY TABS */}
        <div className="admin-toolbar-container">
          <div className="admin-category-tabs">
            <button
              type="button"
              className={activeTab === "all" ? "active" : ""}
              onClick={() => setActiveTab("all")}
            >
              All Records ({totalRecords})
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
              className={activeTab === "other" ? "active" : ""}
              onClick={() => setActiveTab("other")}
            >
              Other Places ({otherPlaces.length})
            </button>
            <button
              type="button"
              className={activeTab === "festivals" ? "active" : ""}
              onClick={() => setActiveTab("festivals")}
            >
              Festival Permissions ({festivalPermissions.length})
            </button>
          </div>

          {/* 7. SEARCH & FILTERS TOOLBAR */}
          <div className="admin-filter-controls">
            <div className="admin-search-input-wrap">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search place, mandal, officer, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="admin-select-filter"
              value={selectedOfficerFilter}
              onChange={(e) => setSelectedOfficerFilter(e.target.value)}
            >
              <option value="all">Created By: All Officers</option>
              {officers.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.full_name || off.username}
                </option>
              ))}
            </select>

            <select
              className="admin-select-filter"
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
            >
              <option value="all">Risk / Status: All</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
              <option value="Approved">Approved Permit</option>
              <option value="Pending">Pending Permit</option>
            </select>

            {(searchQuery || selectedOfficerFilter !== "all" || selectedRiskFilter !== "all" || activeTab !== "all") && (
              <button type="button" className="clear-filters-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* 8. DATA TABLE */}
        <div className="admin-table-container">
          <table className="admin-command-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name / Details</th>
                <th>Location / Area</th>
                <th>Created By</th>
                <th>Status / Risk</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`}>
                    <td colSpan={7}>
                      <div className="table-row-skeleton"></div>
                    </td>
                  </tr>
                ))
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty-box">
                      {activeTab === "places"
                        ? "No religious places registered yet."
                        : activeTab === "festivals"
                        ? "No festival permissions registered yet."
                        : activeTab === "other"
                        ? "No other places registered yet."
                        : "No matching registered records found."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr key={`master-row-${idx}`}>
                    <td>
                      <span className={`admin-cat-pill ${rec.categoryColor}`}>
                        {rec.categoryLabel}
                      </span>
                    </td>
                    <td>
                      <div className="cell-name-title">{rec.name}</div>
                    </td>
                    <td>
                      <div className="cell-subtitle">{rec.subtitle}</div>
                    </td>
                    <td>
                      <span className="officer-badge">👤 {rec.creatorName}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${(rec.status || "low").toLowerCase()}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="cell-date">{rec.date}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-action-view-btn"
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

      {/* 10. ADMINISTRATIVE TOOLS (QUICK ACTIONS AT BOTTOM) */}
      <div className="admin-section-wrapper text-muted-section">
        <div className="section-header-compact">
          <Sliders size={16} className="text-slate-400" />
          <span>ADMINISTRATIVE TOOLS</span>
        </div>
        <div className="admin-tools-grid">
          <Link to="/admin/officers" className="admin-tool-card">
            <UserPlus size={16} className="text-sky" />
            <span>Add Police Officer</span>
          </Link>

          <Link to="/admin/officers" className="admin-tool-card">
            <Users size={16} className="text-teal" />
            <span>Officers Directory</span>
          </Link>

          <Link to="/admin/teams" className="admin-tool-card">
            <Layers size={16} className="text-purple" />
            <span>Squad Teams</span>
          </Link>

          <Link to="/admin/access-control" className="admin-tool-card">
            <Sliders size={16} className="text-amber" />
            <span>Access Control</span>
          </Link>

          <Link to="/admin/duplicate-review" className="admin-tool-card">
            <CopyCheck size={16} className="text-emerald" />
            <span>Duplicate Review</span>
          </Link>

          <Link to="/admin/audit-logs" className="admin-tool-card">
            <FileText size={16} className="text-rose" />
            <span>System Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* 17. VIEW RECORD DETAILS MODAL */}
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
