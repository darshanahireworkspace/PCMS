import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Download,
  Landmark,
  X,
  MapPin,
  Phone,
  ImageOff,
  ShieldCheck,
  Navigation,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getReligiousPlaces,
  deleteReligiousPlace,
} from "../api/religiousPlaceApi";
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

  const cleanPhoto = photoValue
    .replace(/^\/+/, "")
    .replace(/^uploads\//, "");

  return `${backendBase}/uploads/${cleanPhoto}`;
};

function ReligiousPlaces() {
  const navigate = useNavigate();

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [search, setSearch] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const res = await getReligiousPlaces();
      setPlaces(res.data.data || []);
    } catch (error) {
      console.error("Religious places load error:", error);
      toast.error("Failed to load religious places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (!selectedPlace) return undefined;

    setPhotoFailed(false);

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setSelectedPlace(null);
      }
    };

    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [selectedPlace]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this religious place permanently?")) return;

    try {
      await deleteReligiousPlace(id);
      toast.success("Record deleted successfully");

      if (selectedPlace?.id === id) {
        setSelectedPlace(null);
      }

      fetchPlaces();
    } catch (error) {
      console.error("Religious place delete error:", error);
      toast.error("Failed to delete record");
    }
  };

  const filteredPlaces = places.filter((place) => {
    const q = search.toLowerCase().trim();

    if (!q) return true;

    return (
      place.place_name?.toLowerCase().includes(q) ||
      place.place_type?.toLowerCase().includes(q) ||
      place.religion?.toLowerCase().includes(q) ||
      place.area?.toLowerCase().includes(q) ||
      place.ward?.toLowerCase().includes(q) ||
      place.contact_person?.toLowerCase().includes(q) ||
      String(place.contact_mobile || "").toLowerCase().includes(q) ||
      place.police_station?.toLowerCase().includes(q)
    );
  });

  const closeModal = () => {
    setSelectedPlace(null);
    setPhotoFailed(false);
  };

  const openModal = (place) => {
    setPhotoFailed(false);
    setSelectedPlace(place);
  };

  const selectedPhoto =
    selectedPlace?.photo ||
    selectedPlace?.image ||
    selectedPlace?.place_photo ||
    selectedPlace?.religious_place_photo ||
    selectedPlace?.image_url ||
    "";

  const selectedPhotoUrl = getUploadedPhotoUrl(selectedPhoto);

  const mapUrl =
    selectedPlace?.google_map_link ||
    (selectedPlace?.latitude && selectedPlace?.longitude
      ? `https://www.google.com/maps?q=${selectedPlace.latitude},${selectedPlace.longitude}`
      : "");

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Religious Places Database</h2>
          <p className="page-subtitle">
            Live permanent religious locations registered in Malegaon City.
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
            onClick={() => navigate("/add-religious-place")}
          >
            <Plus size={18} />
            Add Religious Place
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={18} />
          <VoiceField
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mandir, masjid, dargah, area, contact..."
          />
        </div>

        <button className="filter-btn" type="button">
          <Filter size={18} />
          Filter
        </button>
      </div>

      <div className="data-table-card">
        <div className="table-responsive">
          <table className="professional-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Place Name</th>
                <th>Type & Religion</th>
                <th>Area / Ward</th>
                <th>Contact Person</th>
                <th>Mobile</th>
                <th>Risk</th>
                <th>Police Station</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">Loading records...</td>
                </tr>
              ) : filteredPlaces.length === 0 ? (
                <tr>
                  <td colSpan="9">No religious place records found.</td>
                </tr>
              ) : (
                filteredPlaces.map((place) => {
                  const photoUrl = getUploadedPhotoUrl(
                    place.image_url || place.image || place.photo
                  );

                  return (
                    <tr key={place.id}>
                      <td>
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={place.place_name}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div className="place-icon">
                            <Landmark size={18} />
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="place-cell">
                          <div>
                            <b>{place.place_name || "-"}</b>
                            <p>Record #{place.id ? String(place.id).slice(0, 8) : "-"}</p>
                          </div>
                        </div>
                      </td>

                      <td>
                        {place.place_type || "-"}
                        {place.religion ? ` (${place.religion})` : ""}
                      </td>

                      <td>
                        {place.area || "-"}
                        {place.ward ? ` / ${place.ward}` : ""}
                      </td>

                      <td>{place.contact_person || "-"}</td>
                      <td>{place.contact_mobile || "-"}</td>

                      <td>
                        <span
                          className={`risk-badge ${(
                            place.risk_level || "low"
                          ).toLowerCase()}`}
                        >
                          {place.risk_level || "Low"}
                        </span>
                      </td>

                      <td>{place.police_station || "-"}</td>

                      <td>
                        <div className="action-group">
                          <button
                            type="button"
                            title="View"
                            onClick={() => openModal(place)}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            title="Edit"
                            onClick={() =>
                              navigate(`/edit-religious-place/${place.id}`)
                            }
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            className="danger-action"
                            onClick={() => handleDelete(place.id)}
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
        <p>Showing {filteredPlaces.length} live records from Supabase</p>
      </div>

      {/* UNIVERSAL RECORD DETAILS MODAL */}
      <RecordDetailsModal
        record={selectedPlace ? { ...selectedPlace, recordType: "Religious Place" } : null}
        onClose={() => setSelectedPlace(null)}
        onEdit={(item) => navigate(`/edit-religious-place/${item.id}`)}
      />
    </div>
  );
}

export default ReligiousPlaces;