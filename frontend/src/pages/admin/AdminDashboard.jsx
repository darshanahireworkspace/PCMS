import { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  UserX,
  MapPin,
  CalendarCheck,
  Building,
  Activity,
  Layers,
  FileCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { getOfficers } from "../../api/officerApi";
import { getTeams } from "../../api/teamsApi";
import { getDashboardStats } from "../../api/dashboardApi";
import { getAuditLogs } from "../../api/auditApi";
import "./AdminPortal.css";

function AdminDashboard() {
  const [officers, setOfficers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        getOfficers(),
        getTeams(),
        getDashboardStats(),
        getAuditLogs({ limit: 10 }),
      ]);

      if (results[0].status === "fulfilled") {
        setOfficers(results[0].value.data?.data || []);
      }
      if (results[1].status === "fulfilled") {
        setTeams(results[1].value.data?.data || []);
      }
      if (results[2].status === "fulfilled") {
        setStats(results[2].value.data?.data?.stats || {});
      }
      if (results[3].status === "fulfilled") {
        setAuditLogs(results[3].value.data?.data || []);
      }
    } catch (err) {
      console.error("Admin dashboard load error:", err);
      toast.error("Failed to load admin dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeOfficers = officers.filter((o) => o.status === "Active");
  const inactiveOfficers = officers.filter((o) => o.status !== "Active");
  const totalRecords =
    (stats.totalPlaces || 0) +
    (stats.festivalPermissions || 0) +
    (stats.otherPlaces || 0);

  return (
    <div className="admin-page-container">
      <div className="admin-header-title">
        <h2>मालेगाव शहर पोलीस व्यवस्थापन</h2>
        <p>सुपर ॲडमिन डॅशबोर्ड • System metrics, active personnel and security activity feed</p>
      </div>

      {/* KPI METRIC CARDS GRID (4 PER ROW DESKTOP) */}
      <div className="admin-kpi-grid">
        {/* ROW 1: PERSONNEL & SQUADS */}
        <div className="admin-kpi-card blue">
          <Users size={28} />
          <div>
            <h3>{loading ? "..." : officers.length}</h3>
            <span>Total Officers</span>
          </div>
        </div>

        <div className="admin-kpi-card teal">
          <ShieldCheck size={28} />
          <div>
            <h3>{loading ? "..." : activeOfficers.length}</h3>
            <span>Active Officers</span>
          </div>
        </div>

        <div className="admin-kpi-card red">
          <UserX size={28} />
          <div>
            <h3>{loading ? "..." : inactiveOfficers.length}</h3>
            <span>Inactive Officers</span>
          </div>
        </div>

        <div className="admin-kpi-card purple">
          <Layers size={28} />
          <div>
            <h3>{loading ? "..." : teams.length}</h3>
            <span>Teams & Squads</span>
          </div>
        </div>

        {/* ROW 2: RECORDS & PERMITS */}
        <div className="admin-kpi-card teal">
          <MapPin size={28} />
          <div>
            <h3>{loading ? "..." : stats.totalPlaces || 0}</h3>
            <span>Religious Places</span>
          </div>
        </div>

        <div className="admin-kpi-card amber">
          <CalendarCheck size={28} />
          <div>
            <h3>{loading ? "..." : stats.festivalPermissions || 0}</h3>
            <span>Festival Permits</span>
          </div>
        </div>

        <div className="admin-kpi-card emerald">
          <Building size={28} />
          <div>
            <h3>{loading ? "..." : stats.otherPlaces || 0}</h3>
            <span>Other Places</span>
          </div>
        </div>

        <div className="admin-kpi-card blue">
          <FileCheck size={28} />
          <div>
            <h3>{loading ? "..." : totalRecords}</h3>
            <span>Total Records</span>
          </div>
        </div>
      </div>

      {/* RECENT AUDIT ACTIVITY FEED */}
      <div className="admin-section-card">
        <div className="section-card-header">
          <div className="title-with-icon">
            <Activity size={18} />
            <h3>Recent System & Security Activity</h3>
          </div>
        </div>

        <div className="audit-feed-list">
          {loading ? (
            <p className="text-muted p-4">Loading system activity...</p>
          ) : auditLogs.length === 0 ? (
            <p className="text-muted p-4">No recent audit activity recorded yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div className="audit-feed-item" key={log.id}>
                <span className="audit-action-tag">{log.action}</span>
                <div className="audit-item-info">
                  <b>{log.user_name || "System"}</b>
                  <p>{log.description}</p>
                </div>
                <span className="audit-time">
                  {new Date(log.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
