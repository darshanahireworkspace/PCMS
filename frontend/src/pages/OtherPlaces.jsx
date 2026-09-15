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
      (err) => {
        if (err.code === 1) {
          toast.error("स्थान परवानगी नाकारली आहे. कृपया ब्राउझर सेटिंग्जमधून लोकेशन सुरू करा.");
        } else if (err.code === 2) {
          toast.error("GPS सिग्नल उपलब्ध नाही. कृपया डिव्हाइसचे लोकेशन सुरू करा.");
        } else if (err.code === 3) {
          toast.error("लोकेशन शोधण्यात वेळ लागला. कृपया पुन्हा प्रयत्न करा.");
        } else {
          toast.error("लोकेशन मिळवण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.");
        }
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
          <h2 className="page-title">इतर महत्त्वाची स्थळे (City Infrastructure)</h2>
          <p className="page-subtitle">
            हॉटेल्स, अमृततुल्य, मेडीकल, दुकाने, मोबाईल शॉपी, दवाखाने, बँका, एटीएम व इतर व्यावसायिक स्थळांची नोंद ठेवा.
          </p>
        </div>

        <button
          className="secondary-btn"
          type="button"
          onClick={detectLocation}
          disabled={locationLoading}
        >
          <Navigation size={18} />
          {locationLoading ? "स्थान शोधत आहे..." : "सध्याचे स्थान मिळवा (GPS)"}
        </button>
      </div>

      <form className="enterprise-form" onSubmit={handleSubmit}>
        {/* SECTION 1: PLACE INFORMATION */}
        <section className="form-section">
          <div className="section-title">
            <Store size={20} />
            <div>
              <h3>विभाग १ — स्थळाची प्राथमिक माहिती</h3>
              <p>व्यावसायिक किंवा नागरी ठिकाणाची ओळख व प्रकार</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>प्रतिष्ठान / स्थळाचे नाव *</label>
              <input
                type="text"
                name="place_name"
                value={form.place_name}
                onChange={handleChange}
                placeholder="उदा. साई अमृततुल्य / सिटी हॉस्पिटल / न्यू मोबाईल शॉपी"
                required
              />
            </div>

            <div className="form-group">
              <label>प्रकार / वर्गवारी *</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="Amruttulya">अमृततुल्य / चहा कॅफे (Amruttulya)</option>
                <option value="Hotel">हॉटेल / लॉज / रेस्टॉरंट (Hotel / Lodge)</option>
                <option value="Medical">मेडीकल / फार्मसी (Medical Store)</option>
                <option value="Mobile Shop">मोबाईल शॉपी (Mobile Shop)</option>
                <option value="Cloth Shop">कापड दुकान (Cloth Shop)</option>
                <option value="Grocery">किराणा दुकान / सुपरमार्केट (Grocery)</option>
                <option value="Garage">गॅरेज / वर्कशॉप (Garage / Auto)</option>
                <option value="School">शाळा / कॉलेज / क्लास (School / College)</option>
                <option value="Hospital">दवाखाना / हॉस्पिटल / लॅब (Hospital / Clinic)</option>
                <option value="ATM">एटीएम / बँक (ATM / Bank)</option>
                <option value="Other">इतर व्यावसायिक स्थळ (Other)</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 2: OWNER & CONTACT */}
        <section className="form-section">
          <div className="section-title">
            <Phone size={20} />
            <div>
              <h3>विभाग २ — मालक व संपर्क तपशील</h3>
              <p>मुख्य मालक / व्यवस्थापकाचे नाव व फोन नंबर</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>मालक / व्यवस्थापकाचे नाव</label>
              <input
                type="text"
                name="owner_name"
                value={form.owner_name}
                onChange={handleChange}
                placeholder="मालकाचे किंवा मॅनेजरचे पूर्ण नाव"
              />
            </div>

            <div className="form-group">
              <label>मोबाईल नंबर</label>
              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="१० अंकी मोबाईल नंबर"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: LOCATION */}
        <section className="form-section">
          <div className="section-title">
            <MapPin size={20} />
            <div>
              <h3>विभाग ३ — ठिकाण व पत्ता</h3>
              <p>परिसर, रस्त्याचा पत्ता व नकाशासाठी जीपीएस स्थान</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>परिसर / प्रभाग</label>
              <input
                type="text"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="उदा. कॉलेज रोड, बस स्टँड जवळ"
              />
            </div>

            <div className="form-group full-width">
              <label>पूर्ण पत्ता</label>
              <textarea
                name="address"
                rows={2}
                value={form.address}
                onChange={handleChange}
                placeholder="दुकान नंबर, इमारतीचे नाव, रस्त्याचा पूर्ण पत्ता..."
              />
            </div>

            <div className="form-group">
              <label>अक्षांश (Latitude)</label>
              <input
                type="text"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                placeholder="उदा. 20.5579"
              />
            </div>

            <div className="form-group">
              <label>रेखांश (Longitude)</label>
              <input
                type="text"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                placeholder="उदा. 74.5287"
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: PHOTO UPLOAD */}
        <section className="form-section">
          <div className="section-title">
            <Camera size={20} />
            <div>
              <h3>विभाग ४ — दुकानाचा / स्थळाचा फोटो</h3>
              <p>प्रतिष्ठानाच्या मुख्य प्रवेशद्वाराचा किंवा बोर्डाचा स्पष्ट फोटो जोडा</p>
            </div>
          </div>

          <div className="photo-upload-card">
            {!photoPreview ? (
              <div className="photo-upload-options-row">
                <label className="upload-box camera-option-box">
                  <Camera size={30} className="upload-icon-teal" />
                  <h4>कॅमेऱ्याने फोटो काढा</h4>
                  <p>मोबाईल कॅमेरा उघडा</p>
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
                  <h4>गॅलरीतून फोटो निवडा</h4>
                  <p>JPG, PNG किंवा WEBP (कमाल 5MB)</p>
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
                    <span>फोटो बदला</span>
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
                    <span>काढून टाका</span>
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
              <h3>विभाग ५ — पोलीस शेरा व विशेष नोंदी</h3>
              <p>अतिरिक्त पोलीस निरीक्षणे, सीसीटीव्ही किंवा सुरक्षिततेच्या नोंदी</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label>पोलीस शेरा</label>
              <textarea
                name="notes"
                rows={2}
                value={form.notes}
                onChange={handleChange}
                placeholder="पोलीस नोंदी व शेरा लिहा..."
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
              ? "सेव्ह होत आहे..."
              : isEditMode
              ? "माहिती अपडेट करा"
              : "स्थळ नोंदणी सेव्ह करा"}
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
            placeholder="नाव, प्रकार, मालक किंवा परिसरावरून शोधा..."
          />
        </div>
      </div>

      <div className="data-table-card">
        <div className="table-responsive">
          <table className="professional-table">
            <thead>
              <tr>
                <th>फोटो</th>
                <th>स्थळाचे नाव</th>
                <th>प्रकार</th>
                <th>परिसर</th>
                <th>मालकाचे नाव</th>
                <th>मोबाईल नंबर</th>
                <th>कृती</th>
              </tr>
            </thead>

            <tbody>
              {filteredPlaces.length === 0 ? (
                <tr>
                  <td colSpan="7">कोणतीही नोंद आढळली नाही.</td>
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
                            title="तपशील पहा"
                            onClick={() => setSelectedOther(item)}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            title="माहिती संपादित करा"
                            onClick={() =>
                              navigate(`/edit-other-place/${item.id}`)
                            }
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title="नोंद हटवा"
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