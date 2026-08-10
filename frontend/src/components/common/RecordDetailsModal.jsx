import { useEffect, useState } from "react";
import {
  X,
  Phone,
  MapPin,
  ExternalLink,
  Pencil,
  Landmark,
  CalendarCheck,
  Store,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  ImageOff,
  User,
  Clock,
  Camera,
  FileText,
  Building,
} from "lucide-react";

export const getUploadedPhotoUrl = (photo) => {
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

  const cleanPhoto = photoValue
    .replace(/^\/+/, "")
    .replace(/^uploads\//, "");

  return `${backendBase}/uploads/${cleanPhoto}`;
};

function RecordDetailsModal({ record, onClose, onEdit }) {
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    if (!record) return undefined;

    setPhotoError(false);

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [record, onClose]);

  if (!record) return null;

  // Determine entity type
  const isReligious =
    record.recordType === "Religious Place" ||
    (record.place_type && !record.category) ||
    record.religion;

  const isFestival =
    record.recordType === "Festival Mandal" ||
    record.festival_name ||
    record.organizer_name ||
    record.permission_status;

  const isOther =
    record.recordType === "Other City Data" ||
    record.category ||
    (!isReligious && !isFestival);

  const entityTypeLabel = isReligious
    ? "Religious Place"
    : isFestival
    ? "Festival Permission"
    : "Other City Place";

  const photoUrl = getUploadedPhotoUrl(record.photo_url || record.photo);

  // Phone number resolution
  const contactPhone =
    record.contact_mobile ||
    record.mobile ||
    record.president_mobile ||
    record.organizer_mobile ||
    record.phone_number ||
    record.contact_number ||
    "";

  // Google Maps link resolution
  const hasCoords =
    record.latitude &&
    record.longitude &&
    Number(record.latitude) !== 0 &&
    Number(record.longitude) !== 0;

  const googleMapsUrl = record.google_map_link ||
    (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${record.latitude},${record.longitude}`
      : record.address || record.area
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${record.place_name || record.organizer_name || ""}, ${record.address || record.area || ""}, Malegaon`
        )}`
      : "");

  // Risk / Status Badge
  const riskLevel = record.risk_level || "Low";
  const permissionStatus = record.permission_status || "Pending";

  return (
    <div
      className="universal-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${entityTypeLabel} Details`}
    >
      <div
        className="universal-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className="universal-modal-header">
          <div className="header-type-chip">
            {isReligious ? (
              <Landmark size={14} />
            ) : isFestival ? (
              <CalendarCheck size={14} />
            ) : (
              <Store size={14} />
            )}
            <span>{entityTypeLabel}</span>
          </div>

          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* PHOTO BANNER */}
        <div className="universal-photo-banner">
          {photoUrl && !photoError ? (
            <img
              src={photoUrl}
              alt={record.place_name || record.organizer_name || "Record photo"}
              onError={() => setPhotoError(true)}
            />
          ) : (
            <div className="universal-photo-placeholder">
              {isReligious ? (
                <Landmark size={48} />
              ) : isFestival ? (
                <CalendarCheck size={48} />
              ) : (
                <Store size={48} />
              )}
              <span>No Photo Uploaded</span>
            </div>
          )}

          {/* RISK / STATUS OVERLAY BADGE */}
          <div className="banner-badge-group">
            {isReligious && (
              <span
                className={`universal-risk-badge ${riskLevel.toLowerCase()}`}
              >
                {riskLevel === "High" ? (
                  <ShieldAlert size={13} />
                ) : riskLevel === "Medium" ? (
                  <AlertCircle size={13} />
                ) : (
                  <ShieldCheck size={13} />
                )}
                {riskLevel} Risk
              </span>
            )}

            {isFestival && (
              <span
                className={`universal-status-badge ${permissionStatus.toLowerCase()}`}
              >
                {permissionStatus}
              </span>
            )}

            {isOther && record.category && (
              <span className="universal-category-badge">
                {record.category}
              </span>
            )}
          </div>
        </div>

        {/* RECORD TITLE & SUBTITLE */}
        <div className="universal-title-block">
          <h2>
            {record.place_name ||
              record.organizer_name ||
              record.president_name ||
              record.festival_name ||
              "Unnamed Record"}
          </h2>
          <p>
            {record.place_type || record.festival_name || record.category || "General"}
            {record.area ? ` • ${record.area}` : ""}
            {record.police_station ? ` • ${record.police_station}` : ""}
          </p>
        </div>

        {/* SCROLLABLE DETAILS BODY */}
        <div className="universal-modal-scroll-body">
          <div className="details-fields-grid">
            {/* RELIGIOUS PLACE FIELDS */}
            {isReligious && (
              <>
                {record.place_name && (
                  <div className="field-box">
                    <label><Building size={13} /> Place Name</label>
                    <b>{record.place_name}</b>
                  </div>
                )}
                {record.religion && (
                  <div className="field-box">
                    <label>Religion</label>
                    <b>{record.religion}</b>
                  </div>
                )}
                {record.place_type && (
                  <div className="field-box">
                    <label>Place Type</label>
                    <b>{record.place_type}</b>
                  </div>
                )}
                {record.trust_management_name && (
                  <div className="field-box">
                    <label>Trust / Management</label>
                    <b>{record.trust_management_name}</b>
                  </div>
                )}
                {record.contact_person && (
                  <div className="field-box">
                    <label><User size={13} /> Contact Person</label>
                    <b>{record.contact_person}</b>
                  </div>
                )}
                {record.contact_mobile && (
                  <div className="field-box">
                    <label><Phone size={13} /> Contact Mobile</label>
                    <a href={`tel:${record.contact_mobile}`} className="phone-link">
                      {record.contact_mobile}
                    </a>
                  </div>
                )}
                {record.alternate_mobile && (
                  <div className="field-box">
                    <label>Alternate Mobile</label>
                    <a href={`tel:${record.alternate_mobile}`} className="phone-link">
                      {record.alternate_mobile}
                    </a>
                  </div>
                )}
                <div className="field-box">
                  <label><Camera size={13} /> CCTV Cameras</label>
                  <b>
                    {record.cctv_available ??
                    record.camera_available ??
                    Number(record.cctv_count || record.camera_count || 0) > 0
                      ? `Yes (${record.cctv_count ?? record.camera_count ?? 0} Cameras)`
                      : "Not Available"}
                  </b>
                </div>
                {record.registration_no && (
                  <div className="field-box">
                    <label>Registration No</label>
                    <b>{record.registration_no}</b>
                  </div>
                )}
              </>
            )}

            {/* FESTIVAL PERMISSION FIELDS */}
            {isFestival && (
              <>
                {record.festival_name && (
                  <div className="field-box">
                    <label><CalendarCheck size={13} /> Festival Name</label>
                    <b>{record.festival_name}</b>
                  </div>
                )}
                {record.organizer_name && (
                  <div className="field-box">
                    <label>Mandal / Organizer</label>
                    <b>{record.organizer_name}</b>
                  </div>
                )}
                {record.president_name && (
                  <div className="field-box">
                    <label><User size={13} /> President Name</label>
                    <b>{record.president_name}</b>
                  </div>
                )}
                {record.president_mobile && (
                  <div className="field-box">
                    <label><Phone size={13} /> President Mobile</label>
                    <a href={`tel:${record.president_mobile}`} className="phone-link">
                      {record.president_mobile}
                    </a>
                  </div>
                )}
                {record.vice_president_name && (
                  <div className="field-box">
                    <label>Vice President</label>
                    <b>{record.vice_president_name}</b>
                  </div>
                )}
                {record.vice_president_mobile && (
                  <div className="field-box">
                    <label>Vice President Mobile</label>
                    <a href={`tel:${record.vice_president_mobile}`} className="phone-link">
                      {record.vice_president_mobile}
                    </a>
                  </div>
                )}
                {record.secretary_name && (
                  <div className="field-box">
                    <label>Secretary Name</label>
                    <b>{record.secretary_name}</b>
                  </div>
                )}
                {(record.secretary_mobile || record.alternate_contact_number) && (
                  <div className="field-box">
                    <label><Phone size={13} /> Secretary Mobile</label>
                    <a href={`tel:${record.secretary_mobile || record.alternate_contact_number}`} className="phone-link">
                      {record.secretary_mobile || record.alternate_contact_number}
                    </a>
                  </div>
                )}
                {record.festival_date && (
                  <div className="field-box">
                    <label><Clock size={13} /> Festival Date</label>
                    <b>{record.festival_date}</b>
                  </div>
                )}
                {(record.start_time || record.end_time) && (
                  <div className="field-box">
                    <label>Timing</label>
                    <b>
                      {record.start_time || "-"} to {record.end_time || "-"}
                    </b>
                  </div>
                )}
                {record.expected_crowd && (
                  <div className="field-box">
                    <label>Expected Crowd</label>
                    <b>{record.expected_crowd}</b>
                  </div>
                )}
                <div className="field-box">
                  <label><ShieldAlert size={13} /> Risk Level</label>
                  <b>{record.risk_level || "Low"} Risk</b>
                </div>
                {record.loudspeaker_permission !== undefined && (
                  <div className="field-box">
                    <label>Loudspeaker Permission</label>
                    <b>{record.loudspeaker_permission ? "Granted" : "Not Requested"}</b>
                  </div>
                )}
                {record.procession_permission !== undefined && (
                  <div className="field-box">
                    <label>Procession Permission</label>
                    <b>{record.procession_permission ? "Allowed" : "No Procession"}</b>
                  </div>
                )}
                {record.procession_route && (
                  <div className="field-box full-width-field">
                    <label>Procession Route</label>
                    <b>{record.procession_route}</b>
                  </div>
                )}
              </>
            )}

            {/* OTHER PLACE FIELDS */}
            {isOther && (
              <>
                {record.place_name && (
                  <div className="field-box">
                    <label><Building size={13} /> Place Name</label>
                    <b>{record.place_name}</b>
                  </div>
                )}
                {record.category && (
                  <div className="field-box">
                    <label>Category</label>
                    <b>{record.category}</b>
                  </div>
                )}
                {record.owner_name && (
                  <div className="field-box">
                    <label><User size={13} /> Owner / Manager</label>
                    <b>{record.owner_name}</b>
                  </div>
                )}
                {record.mobile && (
                  <div className="field-box">
                    <label><Phone size={13} /> Mobile Number</label>
                    <a href={`tel:${record.mobile}`} className="phone-link">
                      {record.mobile}
                    </a>
                  </div>
                )}
              </>
            )}

            {/* COMMON LOCATION & ADDRESS FIELDS */}
            {record.area && (
              <div className="field-box">
                <label><MapPin size={13} /> Area / Locality</label>
                <b>{record.area}</b>
              </div>
            )}
            {record.ward && (
              <div className="field-box">
                <label>Ward No</label>
                <b>{record.ward}</b>
              </div>
            )}
            {record.police_station && (
              <div className="field-box">
                <label>Police Station</label>
                <b>{record.police_station}</b>
              </div>
            )}
            {record.address && (
              <div className="field-box full-width-field">
                <label>Full Address</label>
                <b>{record.address}</b>
              </div>
            )}

            {hasCoords && (
              <>
                <div className="field-box">
                  <label>Latitude</label>
                  <b>{record.latitude}</b>
                </div>
                <div className="field-box">
                  <label>Longitude</label>
                  <b>{record.longitude}</b>
                </div>
              </>
            )}
          </div>

          {/* NOTES BLOCK */}
          {(record.notes || record.sensitive_notes || record.police_notes) && (
            <div className="modal-notes-card">
              <label><FileText size={14} /> Police Notes / Observations</label>
              <p>
                {record.sensitive_notes ||
                  record.police_notes ||
                  record.notes}
              </p>
            </div>
          )}
        </div>

        {/* STICKY FOOTER ACTIONS */}
        <div className="universal-modal-footer">
          {contactPhone ? (
            <a
              href={`tel:${contactPhone}`}
              className="footer-btn call-btn"
            >
              <Phone size={16} />
              Call
            </a>
          ) : (
            <button type="button" className="footer-btn call-btn disabled" disabled>
              <Phone size={16} />
              No Phone
            </button>
          )}

          {googleMapsUrl ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="footer-btn maps-btn"
            >
              <ExternalLink size={16} />
              Google Maps
            </a>
          ) : (
            <button type="button" className="footer-btn maps-btn disabled" disabled>
              <MapPin size={16} />
              No Location
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              className="footer-btn edit-btn"
              onClick={() => {
                onClose();
                onEdit(record);
              }}
            >
              <Pencil size={16} />
              Edit
            </button>
          )}

          <button
            type="button"
            className="footer-btn close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecordDetailsModal;
