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
} from "lucide-react";
import toast from "react-hot-toast";
import { getOfficers } from "../../api/officerApi";
import { getTeams } from "../../api/teamsApi";
import { getDashboardStats } from "../../api/dashboardApi";
import { useAdminAuth } from "../../context/AdminAuthContext";
import "./AdminPortal.css";

function AdminDashboard() {
  const { adminUser } = useAdminAuth();
  const [officers, setOfficers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        getOfficers(),
        getTeams(),
        getDashboardStats(),
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
  const totalRecords =
    (stats.totalPlaces || 0) +
    (stats.festivalPermissions || 0) +
    (stats.otherPlaces || 0);

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
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
