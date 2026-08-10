import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Phone,
  MapPin,
  Store,
  Search,
  Upload,
  Camera,
  RefreshCw,
  Navigation,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  createOtherPlace,
  getOtherPlaces,
  getSingleOtherPlace,
  updateOtherPlace,
  deleteOtherPlace,
} from "../api/otherPlaceApi";
import RecordDetailsModal from "../components/common/RecordDetailsModal";

const INITIAL_FORM = {
  place_name: "",
  category: "Hotel",
  owner_name: "",
  mobile: "",
  address: "",
  area: "",
  latitude: "",
  longitude: "",
  google_map_link: "",
  notes: "",
  photo: "",
};

function OtherPlaces() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedOther, setSelectedOther] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const getPhotoUrl = (photo) => {
    if (!photo) return "";
    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://") ||
      photo.startsWith("blob:") ||
      photo.startsWith("data:")
    ) {
      return photo;
    }
    const backendBase = (import.meta.env.VITE_API_URL || "").replace(
      /\/api\/?$/,
      ""
    );
    const cleanPhoto = photo.replace(/^\/+/, "").replace(/^uploads\//, "");
    return `${backendBase}/uploads/${cleanPhoto}`;
  };

  const loadPlaces = async () => {
    try {
      const res = await getOtherPlaces();
      setPlaces(res.data.data || []);
    } catch (error) {
      console.error("Other places load error:", error);
      toast.error("Failed to load other places");
    }
  };

  useEffect(() => {
    loadPlaces();
    if (!isEditMode) {
      detectLocation();
    }
  }, []);

  useEffect(() => {
    const loadSingle = async () => {
      if (!id) return;
      try {
        const res = await getSingleOtherPlace(id);
        const data = res.data.data;
        const existingPhoto = data.photo || data.image || data.photo_url || "";

        setForm({
          place_name: data.place_name || "",
          category: data.category || "Hotel",
          owner_name: data.owner_name || "",
          mobile: data.mobile || "",
          address: data.address || "",
          area: data.area || "",
          latitude: data.latitude || "",
          longitude: data.longitude || "",
          google_map_link: data.google_map_link || "",
          notes: data.notes || "",
          photo: existingPhoto,
        });

        if (existingPhoto) {
          setPhotoPreview(getPhotoUrl(existingPhoto));
        }
      } catch (error) {
        console.error("Single other place error:", error);
        toast.error("Failed to load record");
      }
    };

    loadSingle();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG or WEBP photo allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size must be under 5MB");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setForm((prev) => ({ ...prev, photo: "" }));
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await res.json();
      const address = data.address || {};

      setForm((prev) => ({
        ...prev,
        address: data.display_name || "",
        area:
          address.suburb ||
          address.neighbourhood ||
          address.road ||
          address.village ||
          address.town ||
          address.city ||
          "",
      }));
    } catch {
      toast.error("Address auto-fill failed");
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location not supported");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(7);
        const lng = position.coords.longitude.toFixed(7);

        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          google_map_link: `https://www.google.com/maps?q=${lat},${lng}`,
        }));

        await reverseGeocode(lat, lng);
        setLocationLoading(false);
        toast.success("Location auto-detected");
      },
      () => {
        toast.error("Please allow location permission");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.place_name.trim()) {
      toast.error("Place Name is required");
      return;
    }

    if (!form.category.trim()) {
      toast.error("Category is required");
      return;
    }

    if (!form.latitude || !form.longitude) {
      toast.error("Please detect current location coordinates");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key !== "photo") {
          formData.append(key, value ?? "");
        }
      });

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      if (isEditMode) {
        await updateOtherPlace(id, formData);
        toast.success("Other place updated successfully");
        navigate("/other-places");
      } else {
        await createOtherPlace(formData);
        toast.success("Other place added successfully");
        setForm(INITIAL_FORM);
        setPhotoFile(null);
        setPhotoPreview("");
        await loadPlaces();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save place");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm("Delete this place record permanently?")) return;

    try {
      await deleteOtherPlace(recordId);
      toast.success("Record deleted");
      setSelectedOther(null);
      await loadPlaces();
    } catch {
      toast.error("Delete failed");
    }
  };

  const filteredPlaces = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return places;
    return places.filter((item) => {
      const text = `
        ${item.place_name || ""}
        ${item.category || ""}
        ${item.owner_name || ""}
        ${item.area || ""}
        ${item.mobile || ""}
        ${item.address || ""}
      `.toLowerCase();
      return text.includes(q);
    });
  }, [places, search]);

  return (
    <div className="other-places-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">City Infrastructure Directory</h2>
          <p className="page-subtitle">
            Store hotels, medicals, shops, Amruttulya, mobile shops, hospitals, ATMs and civic locations.
          </p>
        </div>

        <button
          className="secondary-btn"
          type="button"
          onClick={detectLocation}
          disabled={locationLoading}
        >
          <Navigation size={18} />
          {locationLoading ? "Detecting..." : "Detect Current Location"}
        </button>
      </div>

      <form className="enterprise-form" onSubmit={handleSubmit}>
        {/* SECTION 1: PLACE INFORMATION */}
        <section className="form-section">
          <div className="section-title">
            <Store size={20} />
            <div>
              <h3>01. Place Information</h3>
              <p>Commercial or civic place identification and category</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Place Name *</label>
              <input
                type="text"
                name="place_name"
                value={form.place_name}
                onChange={handleChange}
                placeholder="e.g. Sai Amruttulya / City Hospital"
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="Amruttulya">Amruttulya</option>
                <option value="Hotel">Hotel</option>
                <option value="Medical">Medical / Pharmacy</option>
                <option value="Mobile Shop">Mobile Shop</option>
                <option value="Cloth Shop">Cloth Shop</option>
                <option value="Grocery">Grocery / Kirana</option>
                <option value="Garage">Garage / Workshop</option>
                <option value="School">School / College</option>
                <option value="Hospital">Hospital / Clinic</option>
                <option value="ATM">ATM / Bank</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 2: OWNER & CONTACT */}
        <section className="form-section">
          <div className="section-title">
            <Phone size={20} />
            <div>
              <h3>02. Owner & Contact Information</h3>
              <p>Primary owner / manager and contact details</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Owner / Contact Person</label>
              <input
                type="text"
                name="owner_name"
                value={form.owner_name}
                onChange={handleChange}
                placeholder="Owner or manager full name"
              />
            </div>

            <div className="form-group">
              <label>Contact Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="10-digit mobile number"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: LOCATION */}
        <section className="form-section">
          <div className="section-title">
            <MapPin size={20} />
            <div>
              <h3>03. Location & Address</h3>
              <p>Area, street address and GIS GPS coordinates</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Area / Locality</label>
              <input
                type="text"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="Locality area"
              />
            </div>

            <div className="form-group full-width">
              <label>Full Address</label>
              <textarea
                name="address"
                rows={2}
                value={form.address}
                onChange={handleChange}
                placeholder="Full address details..."
              />
            </div>

            <div className="form-group">
              <label>Latitude</label>
              <input
                type="text"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                placeholder="e.g. 20.5579"
              />
            </div>

            <div className="form-group">
              <label>Longitude</label>
              <input
                type="text"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                placeholder="e.g. 74.5287"
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: PHOTO UPLOAD */}
        <section className="form-section">
          <div className="section-title">
            <Camera size={20} />
            <div>
              <h3>04. Shop / Place Photograph</h3>
              <p>Upload a clear photo of the place storefront or entrance</p>
            </div>
          </div>

          <div className="photo-upload-card">
            {!photoPreview ? (
              <div className="photo-upload-options-row">
                <label className="upload-box camera-option-box">
                  <Camera size={30} className="upload-icon-teal" />
                  <h4>Take Photo</h4>
                  <p>Capture storefront using device camera</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={handlePhotoSelect}
                  />
                </label>

                <label className="upload-box gallery-option-box">
                  <Upload size={30} className="upload-icon-blue" />
                  <h4>Choose from Gallery</h4>
                  <p>JPG, PNG or WEBP (Max 5MB)</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handlePhotoSelect}
                  />
                </label>
              </div>
            ) : (
              <div className="photo-preview-box">
                <img src={photoPreview} alt="Other Place Preview" />
                <div className="photo-preview-actions">
                  <label className="photo-change-btn">
                    <RefreshCw size={15} />
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={handlePhotoSelect}
                    />
                  </label>

                  <button
                    type="button"
                    className="photo-remove-btn"
                    onClick={removePhoto}
                  >
                    <Trash2 size={15} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 5: NOTES */}
        <section className="form-section">
          <div className="section-title">
            <Store size={20} />
            <div>
              <h3>05. Police Notes</h3>
              <p>Any additional police observations or details</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label>Additional Notes</label>
              <textarea
                name="notes"
                rows={2}
                value={form.notes}
                onChange={handleChange}
                placeholder="Police notes..."
              />
            </div>
          </div>
        </section>

        {/* FORM ACTIONS */}
        <div className="form-actions">
          <button
            type="submit"
            className="primary-btn"
            disabled={submitting}
          >
            <Plus size={18} />
            {submitting
              ? "Saving..."
              : isEditMode
              ? "Update Other Place"
              : "Save Other Place"}
          </button>
        </div>
      </form>

      {/* DIRECTORY TABLE & SEARCH */}
      <div className="table-toolbar" style={{ marginTop: "32px" }}>
        <div className="table-search">
          <Search size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search other city data by name, category, owner..."
          />
        </div>
      </div>

      <div className="data-table-card">
        <div className="table-responsive">
          <table className="professional-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Category</th>
                <th>Area</th>
                <th>Owner</th>
                <th>Mobile</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPlaces.length === 0 ? (
                <tr>
                  <td colSpan="7">No records found.</td>
                </tr>
              ) : (
                filteredPlaces.map((item) => {
                  const itemPhoto = getPhotoUrl(item.photo || item.image || item.photo_url);

                  return (
                    <tr key={item.id}>
                      <td>
                        {itemPhoto ? (
                          <img
                            className="other-table-photo"
                            src={itemPhoto}
                            alt={item.place_name}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div className="place-icon">
                            <Store size={18} />
                          </div>
                        )}
                      </td>
                      <td>
                        <b>{item.place_name}</b>
                      </td>
                      <td>
                        <span className="category-badge">{item.category}</span>
                      </td>
                      <td>{item.area || "-"}</td>
                      <td>{item.owner_name || "-"}</td>
                      <td>{item.mobile || "-"}</td>
                      <td>
                        <div className="action-group">
                          <button
                            type="button"
                            title="View details"
                            onClick={() => setSelectedOther(item)}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            title="Edit record"
                            onClick={() =>
                              navigate(`/edit-other-place/${item.id}`)
                            }
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title="Delete record"
                            className="danger-action"
                            onClick={() => handleDelete(item.id)}
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

      {/* VIEW DETAILS MODAL */}
      {/* UNIVERSAL RECORD DETAILS MODAL */}
      <RecordDetailsModal
        record={selectedOther ? { ...selectedOther, recordType: "Other City Data" } : null}
        onClose={() => setSelectedOther(null)}
        onEdit={(item) => navigate(`/edit-other-place/${item.id}`)}
      />
    </div>
  );
}

export default OtherPlaces;