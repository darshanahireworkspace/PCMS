import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Shield,
  ShieldAlert,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  UserCheck,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import { getTeams, createTeam, updateTeam, deleteTeam } from "../../api/teamsApi";
import { getOfficers } from "../../api/officerApi";

function TeamsManagement() {
  const [teams, setTeams] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [dataSharing, setDataSharing] = useState(true);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamRes, offRes] = await Promise.all([getTeams(), getOfficers()]);
      setTeams(teamRes.data.data || []);
      setOfficers(offRes.data.data || []);
    } catch (err) {
      console.error("Teams load error:", err);
      toast.error("Failed to load teams directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setTeamName("");
    setDescription("");
    setDataSharing(true);
    setSelectedMemberIds([]);
    setMemberSearch("");
    setShowModal(true);
  };

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    setTeamName(team.team_name || "");
    setDescription(team.description || "");
    setDataSharing(team.data_sharing ?? true);
    const existingIds = (team.team_members || []).map((m) => m.officer_id);
    setSelectedMemberIds(existingIds);
    setMemberSearch("");
    setShowModal(true);
  };

  const toggleMemberSelection = (officerId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(officerId) ? prev.filter((id) => id !== officerId) : [...prev, officerId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error("Team name is required");
      return;
    }

    try {
      const payload = {
        team_name: teamName.trim(),
        description: description.trim(),
        data_sharing: dataSharing,
        member_ids: selectedMemberIds,
      };

      if (editingTeam) {
        await updateTeam(editingTeam.id, payload);
        toast.success(`Team "${teamName}" updated successfully`);
      } else {
        await createTeam(payload);
        toast.success(`Team "${teamName}" created successfully`);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error("Save team error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to save team");
    }
  };

  const handleToggleSharing = async (team) => {
    const newSharing = !team.data_sharing;
    try {
      await updateTeam(team.id, { data_sharing: newSharing });
      toast.success(`Data sharing for "${team.team_name}" set to ${newSharing ? "ON" : "OFF"}`);
      loadData();
    } catch {
      toast.error("Failed to update data sharing mode");
    }
  };

  const handleDeleteTeam = async (team) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete team squad "${team.team_name}"? All officer member assignments for this team will be removed.`
      )
    ) {
      return;
    }

    try {
      await deleteTeam(team.id);
      toast.success(`Team squad "${team.team_name}" deleted successfully`);
      loadData();
    } catch (err) {
      console.error("Delete team error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to delete team");
    }
  };

  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = t.team_name?.toLowerCase().includes(q);
    const descMatch = t.description?.toLowerCase().includes(q);
    const memberMatch = (t.team_members || []).some((m) =>
      m.officers?.full_name?.toLowerCase().includes(q)
    );
    return nameMatch || descMatch || memberMatch;
  });

  const totalTeamsCount = teams.length;
  const sharingActiveCount = teams.filter((t) => t.data_sharing).length;
  const totalAssignedOfficersCount = teams.reduce(
    (acc, t) => acc + (t.team_members || []).length,
    0
  );

  const filteredModalOfficers = officers.filter((off) => {
    const q = memberSearch.toLowerCase().trim();
    return (
      !q ||
      off.full_name?.toLowerCase().includes(q) ||
      off.username?.toLowerCase().includes(q) ||
      off.designation?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-page-container">
      {/* HEADER SECTION */}
      <div className="admin-header-row">
        <div>
          <h2>Squad Teams & Shared Access</h2>
          <p>Create police squads, assign personnel, and configure inter-team data sharing rules</p>
        </div>

        <button type="button" className="primary-btn" onClick={handleOpenCreate}>
          <Plus size={16} />
          Create Team Squad
        </button>
      </div>

      {/* STAT SUMMARY STRIP & SEARCH TOOLBAR */}
      <div className="admin-toolbar-card">
        <div className="stat-summary-row">
          <div className="stat-pill">
            <Users size={16} className="text-teal" />
            <span>Total Squads: <b>{totalTeamsCount}</b></span>
          </div>

          <div className="stat-pill">
            <Shield size={16} className="text-green" />
            <span>Data Sharing Active: <b>{sharingActiveCount}</b></span>
          </div>

          <div className="stat-pill">
            <UserCheck size={16} className="text-blue" />
            <span>Assigned Personnel: <b>{totalAssignedOfficersCount}</b></span>
          </div>
        </div>

        <div className="admin-search-box mt-3">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams by squad name, description, or officer member..."
          />
        </div>
      </div>

      {/* TEAMS GRID CARDS */}
      <div className="admin-grid-cards">
        {loading ? (
          <div className="admin-section-card p-6 text-center text-muted">
            Loading team directory...
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="admin-section-card p-6 text-center text-muted">
            {searchQuery ? "No matching team squads found." : "No squad teams created yet. Click 'Create Team Squad' to get started."}
          </div>
        ) : (
          filteredTeams.map((team) => {
            const members = team.team_members || [];
            return (
              <div className="admin-team-card" key={team.id}>
                <div className="team-card-header">
                  <div className="team-info">
                    <h3>
                      <Building2 size={18} className="text-teal" />
                      {team.team_name}
                    </h3>
                    <p>{team.description || "No squad description specified"}</p>
                  </div>

                  <span className={`sharing-badge ${team.data_sharing ? "on" : "off"}`}>
                    {team.data_sharing ? <Shield size={13} /> : <ShieldAlert size={13} />}
                    Sharing: {team.data_sharing ? "ON" : "OFF"}
                  </span>
                </div>

                <div className="team-members-strip">
                  <span className="members-count-label">
                    <Users size={14} /> {members.length} Squad Personnel Assigned
                  </span>

                  <div className="member-tags-row">
                    {members.length === 0 ? (
                      <span className="text-muted text-xs">No officers assigned to squad yet</span>
                    ) : (
                      members.map((m) => (
                        <span key={m.officer_id || m.id} className="member-tag">
                          {m.officers?.full_name || "Officer Member"}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="team-card-actions">
                  <button
                    type="button"
                    className="secondary-btn btn-sm"
                    onClick={() => handleToggleSharing(team)}
                    title="Toggle inter-team record sharing"
                  >
                    <Shield size={14} />
                    {team.data_sharing ? "Disable Sharing" : "Enable Sharing"}
                  </button>

                  <div className="table-actions-row">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => handleOpenEdit(team)}
                      title="Edit Squad Details"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      type="button"
                      className="icon-action-btn red"
                      onClick={() => handleDeleteTeam(team)}
                      title="Delete Squad Team Permanently"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT TEAM SQUAD MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="admin-modal-card">
            <div className="modal-header">
              <h3>{editingTeam ? "Edit Squad Team" : "Create New Police Squad Team"}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Squad Team Name *</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Chhavani Verification Squad Alpha"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description & Ward Coverage</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Religious place verification and patrol squad"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={dataSharing}
                    onChange={(e) => setDataSharing(e.target.checked)}
                  />
                  <span>Enable Inter-Team Data Sharing (Squad members view team records)</span>
                </label>
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="m-0">Assign Officer Members</label>
                  <small className="text-muted">
                    {selectedMemberIds.length} selected
                  </small>
                </div>

                <div className="admin-search-box mb-2">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Filter officers by name or designation..."
                    className="py-1 text-xs"
                  />
                </div>

                <div className="members-select-list">
                  {filteredModalOfficers.length === 0 ? (
                    <div className="p-3 text-center text-muted text-xs">
                      No officers found matching search.
                    </div>
                  ) : (
                    filteredModalOfficers.map((off) => {
                      const isSelected = selectedMemberIds.includes(off.id);
                      return (
                        <div
                          key={off.id}
                          className={`member-select-item ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleMemberSelection(off.id)}
                        >
                          <div>
                            <b>{off.full_name}</b>
                            <small>{off.designation || "Constable"} • {off.username}</small>
                          </div>
                          {isSelected && <Check size={16} className="text-teal" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {editingTeam ? "Save Team Squad" : "Create Team Squad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamsManagement;
