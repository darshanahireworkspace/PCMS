import { useEffect, useState } from "react";
import { FileText, Search, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { getAuditLogs } from "../../api/auditApi";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await getAuditLogs({ limit: 150 });
      setLogs(res.data.data || []);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = searchUser.toLowerCase().trim();
    return (
      !q ||
      log.user_name?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-page-container">
      <div className="admin-header-row">
        <div>
          <h2>System & Officer Audit Logs</h2>
          <p>Security activity log tracking officer actions, data edits & admin operations</p>
        </div>

        <button type="button" className="secondary-btn" onClick={loadLogs}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="admin-toolbar-card">
        <div className="admin-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            placeholder="Search audit logs by officer, action, or description..."
          />
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="admin-table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Officer / User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-muted">
                    No audit logs matching search filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <small>
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </small>
                    </td>
                    <td>
                      <b>{log.user_name || "System"}</b>
                    </td>
                    <td>
                      <span className="audit-action-tag">{log.action}</span>
                    </td>
                    <td><code>{log.entity_type}</code></td>
                    <td>{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
