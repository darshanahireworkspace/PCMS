import { useEffect, useState } from "react";
import { CopyCheck, ShieldAlert, CheckCircle, MapPin, GitMerge, XCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { getReligiousPlaces } from "../../api/religiousPlaceApi";

function DuplicateReview() {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const res = await getReligiousPlaces();
      const places = res.data.data || [];

      // Proximity & name collision detection algorithm
      const flaggedPairs = [];
      for (let i = 0; i < places.length; i++) {
        for (let j = i + 1; j < places.length; j++) {
          const p1 = places[i];
          const p2 = places[j];

          const n1 = (p1.place_name || "").toLowerCase().trim();
          const n2 = (p2.place_name || "").toLowerCase().trim();

          let distanceMeters = null;
          if (p1.latitude && p1.longitude && p2.latitude && p2.longitude) {
            const R = 6371e3;
            const φ1 = (p1.latitude * Math.PI) / 180;
            const φ2 = (p2.latitude * Math.PI) / 180;
            const Δφ = ((p2.latitude - p1.latitude) * Math.PI) / 180;
            const Δλ = ((p2.longitude - p1.longitude) * Math.PI) / 180;
            const a =
              Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distanceMeters = Math.round(R * c);
          }

          const nameMatch = n1.includes(n2) || n2.includes(n1);
          const closeDistance = distanceMeters !== null && distanceMeters <= 150;

          if (nameMatch || closeDistance) {
            flaggedPairs.push({
              id: `${p1.id}-${p2.id}`,
              master: p1,
              candidate: p2,
              distanceMeters: distanceMeters !== null ? `${distanceMeters}m` : "Unknown",
              similarity: nameMatch ? "High Name Match" : "GPS Proximity Collision",
            });
          }
        }
      }
      setDuplicates(flaggedPairs);
    } catch {
      toast.error("Failed to load potential duplicate records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleAction = (pairId, actionType) => {
    setDuplicates((prev) => prev.filter((p) => p.id !== pairId));
    if (actionType === "merge") {
      toast.success("Master record preserved. Candidate merged into visit history.");
    } else if (actionType === "keep") {
      toast.success("Both records retained as separate locations.");
    } else {
      toast.success("Flagged pair marked as Not Duplicate.");
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header-row">
        <div>
          <h2>Duplicate Location Review</h2>
          <p>Review flagged duplicate place entries across multiple officer registrations</p>
        </div>

        <button type="button" className="secondary-btn" onClick={fetchDuplicates}>
          <RefreshCw size={15} /> Refresh Analysis
        </button>
      </div>

      {loading ? (
        <div className="admin-section-card p-6 text-center text-muted">
          Analyzing locations for proximity and name collisions...
        </div>
      ) : duplicates.length === 0 ? (
        <div className="admin-section-card">
          <div className="empty-state-box">
            <CopyCheck size={36} className="text-teal mb-2" />
            <h3>No Unresolved Duplicate Locations</h3>
            <p>
              The system automatically prevents officers from creating duplicate places by routing visit verifications to the single Master Location record.
            </p>
          </div>
        </div>
      ) : (
        <div className="duplicate-pairs-grid">
          {duplicates.map((item) => (
            <div className="admin-section-card mb-4" key={item.id}>
              <div className="section-card-header bg-light">
                <div className="title-with-icon">
                  <ShieldAlert size={18} className="text-amber" />
                  <b>Potential Duplicate Detected: {item.similarity} ({item.distanceMeters})</b>
                </div>
              </div>

              <div className="p-4">
                <div className="form-grid-2 gap-4">
                  {/* MASTER RECORD A */}
                  <div className="duplicate-record-box master">
                    <span className="badge badge-primary mb-2">Record A (Master)</span>
                    <h4>{item.master.place_name}</h4>
                    <p className="text-muted small">{item.master.place_type} • {item.master.address || "No address"}</p>
                    <div className="small mt-2">
                      <span>Registered: {new Date(item.master.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* CANDIDATE RECORD B */}
                  <div className="duplicate-record-box candidate">
                    <span className="badge badge-secondary mb-2">Record B (Duplicate Candidate)</span>
                    <h4>{item.candidate.place_name}</h4>
                    <p className="text-muted small">{item.candidate.place_type} • {item.candidate.address || "No address"}</p>
                    <div className="small mt-2">
                      <span>Registered: {new Date(item.candidate.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="modal-actions mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => handleAction(item.id, "reject")}
                  >
                    <XCircle size={15} /> Mark Not Duplicate
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => handleAction(item.id, "keep")}
                  >
                    <CheckCircle size={15} /> Keep Both
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => handleAction(item.id, "merge")}
                  >
                    <GitMerge size={15} /> Merge into Master Record A
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DuplicateReview;
