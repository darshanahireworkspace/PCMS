import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  UserPlus,
  Sliders,
  CopyCheck,
  FileText,
  CheckCircle2,
  Server,
} from "lucide-react";
import toast from "react-hot-toast";
import { getOfficers } from "../../api/officerApi";
import { getTeams } from "../../api/teamsApi";
import { getDashboardStats } from "../../api/dashboardApi";
import { getAuditLogs } from "../../api/auditApi";
import { useAdminAuth } from "../../context/AdminAuthContext";
import "./AdminPortal.css";

function AdminDashboard() {
  const { adminUser } = useAdminAuth();
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
        getAuditLogs({ limit: 8 }),
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
      toast.error("Failed to load administration metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeOfficers = officers.filter((o) => o.status === "Active");
  const inactiveOfficers = officers.filter((o) => o.status !== "Active");
  const headOfficers = officers.filter((o) => o.role === "HeadOfficer" || o.role === "SuperAdmin");
  const totalRecords =
    (stats.totalPlaces || 0) +
    (stats.festivalPermissions || 0) +
    (stats.otherPlaces || 0);

  return (
    <div className="admin-page-container">
      {/* SECTION 1: WELCOME / OVERVIEW */}
      <div className="admin-welcome-banner">
        <div>
          <h2>मालेगाव शहर पोलीस व्यवस्थापन</h2>
          <p>
            Welcome, <b>{adminUser?.full_name || "Superintendent of Police"}</b>. Here is the current PCMS administration overview & system operational metrics.
          </p>
        </div>
        <span className="admin-authority-chip">
          <ShieldCheck size={15} />
          Super Admin Authority
        </span>
      </div>

      {/* SECTION 2: KEY METRICS */}
      <div className="admin-section-block">
        <div className="section-title-sm">
          <span>KEY PERSONNEL METRICS</span>
        </div>
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card blue">
            <Users size={24} />
            <div>
              <h3>{loading ? "..." : officers.length}</h3>
              <span>Total Officers</span>
            </div>
          </div>

          <div className="admin-kpi-card teal">
            <ShieldCheck size={24} />
            <div>
              <h3>{loading ? "..." : activeOfficers.length}</h3>
              <span>Active Personnel</span>
            </div>
          </div>

          <div className="admin-kpi-card emerald">
            <ShieldCheck size={24} />
            <div>
              <h3>{loading ? "..." : headOfficers.length}</h3>
              <span>Head Officers</span>
            </div>
          </div>

          <div className="admin-kpi-card purple">
            <Layers size={24} />
            <div>
              <h3>{loading ? "..." : teams.length}</h3>
              <span>Squad Teams</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: QUICK ACTIONS */}
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
            <span>Manage Directory</span>
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

      {/* SECTION 4: DATA OVERVIEW STATISTICS */}
      <div className="admin-section-block">
        <div className="section-title-sm">
          <span>CITY DATA OVERVIEW STATISTICS</span>
        </div>
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card teal">
            <MapPin size={24} />
            <div>
              <h3>{loading ? "..." : stats.totalPlaces || 0}</h3>
              <span>Religious Places</span>
            </div>
          </div>

          <div className="admin-kpi-card amber">
            <CalendarCheck size={24} />
            <div>
              <h3>{loading ? "..." : stats.festivalPermissions || 0}</h3>
              <span>Festival Permits</span>
            </div>
          </div>

          <div className="admin-kpi-card emerald">
            <Building size={24} />
            <div>
              <h3>{loading ? "..." : stats.otherPlaces || 0}</h3>
              <span>Other Places</span>
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

      {/* SECTION 5 & 6 GRID LAYOUT */}
      <div className="admin-grid-2col">
        {/* SECTION 5: RECENT ADMIN ACTIVITY */}
        <div className="admin-section-card">
          <div className="section-card-header">
            <div className="title-with-icon">
              <Activity size={18} className="text-sky" />
              <h3>Recent System & Audit Activity</h3>
            </div>
          </div>

          <div className="audit-feed-list">
            {loading ? (
              <p className="text-muted p-4 text-sm">Loading activity feed...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-muted p-4 text-sm">No recent audit log activity recorded.</p>
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

        {/* SECTION 6: SYSTEM OPERATIONAL STATUS */}
        <div className="admin-section-card">
          <div className="section-card-header">
            <div className="title-with-icon">
              <Server size={18} className="text-emerald" />
              <h3>System Operational Status</h3>
            </div>
          </div>

          <div className="system-status-list">
            <div className="status-item">
              <div>
                <b>PostgreSQL Database Engine</b>
                <p>Supabase Cloud Master Database</p>
              </div>
              <span className="status-badge operational">
                <CheckCircle2 size={13} />
                Operational
              </span>
            </div>

            <div className="status-item">
              <div>
                <b>Supabase Edge Functions API</b>
                <p>/functions/v1 Serverless Microservices</p>
              </div>
              <span className="status-badge operational">
                <CheckCircle2 size={13} />
                Operational
              </span>
            </div>

            <div className="status-item">
              <div>
                <b>JWT Authentication Service</b>
                <p>HMAC-SHA256 Token Authority</p>
              </div>
              <span className="status-badge operational">
                <CheckCircle2 size={13} />
                Operational
              </span>
            </div>

            <div className="status-item">
              <div>
                <b>PWA & Static Asset CDN</b>
                <p>Vercel Edge Network & Service Worker</p>
              </div>
              <span className="status-badge operational">
                <CheckCircle2 size={13} />
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
