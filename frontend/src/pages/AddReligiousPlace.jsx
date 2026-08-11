import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  MapPin,
  Users,
  ShieldAlert,
  Upload,
  Save,
  Navigation,
  Camera,
  Trash2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  createReligiousPlace,
  getSingleReligiousPlace,
  updateReligiousPlace,
  checkDuplicatePlace,
  recordPlaceVisit,
} from "../api/religiousPlaceApi";
import { getPoliceStations } from "../api/policeStationApi";

function AddReligiousPlace() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [policeStations, setPoliceStations] = useState([]);
  const [cctvAvailable, setCctvAvailable] = useState("No");

  const [duplicateModalData, setDuplicateModalData] = useState(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitNotes, setVisitNotes] = useState("");
  const [savingVisit, setSavingVisit] = useState(false);

  const [form, setForm] = useState({
    place_name: "",
    religion: "Hindu",
    place_type: "Temple",
    address: "",
    area: "",
    ward: "",
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    google_map_link: "",
    police_station: "",
    contact_person: "",
    contact_mobile: "",
    president_name: "",
    secretary_name: "",
    regular_crowd: "Low",
    risk_level: "Low",
    cctv_count: "0",
    sensitive_notes: "",
  });

  useEffect(() => {
    loadPoliceStations();
    if (!isEditMode) {
      detectCurrentLocation();
    }
  }, []);

  useEffect(() => {
    const loadSinglePlace = async () => {
      if (!id) return;
      try {
        const res = await getSingleReligiousPlace(id);
        const data = res.data.data;

        setForm({
          place_name: data.place_name || "",
          religion: data.religion || "Hindu",
          place_type: data.place_type || "Temple",
          address: data.address || "",
          area: data.area || "",
          ward: data.ward || "",
          taluka: data.taluka || "",
          district: data.district || "",
          state: data.state || "",
          pincode: data.pincode || "",
          latitude: data.latitude || "",
          longitude: data.longitude || "",
          google_map_link: data.google_map_link || "",
          police_station: data.police_station || "",
          contact_person: data.contact_person || "",
          contact_mobile: data.contact_mobile || "",
          president_name: data.president_name || data.trust_management_name || "",
          secretary_name: data.secretary_name || data.alternate_mobile || "",
          regular_crowd: data.regular_crowd || "Low",
          risk_level: data.risk_level || "Low",
          cctv_count: String(data.cctv_count ?? data.camera_count ?? "0"),
          sensitive_notes: data.sensitive_notes || data.notes || "",
        });

        const hasCctv = Boolean(
          data.cctv_available ??
            data.camera_available ??
            (Number(data.cctv_count || data.camera_count || 0) > 0)
        );
        setCctvAvailable(hasCctv ? "Yes" : "No");

        const existingPhoto = data.image_url || data.image || data.photo || "";
        if (existingPhoto) {
          setImagePreview(existingPhoto);
        }
      } catch {
        toast.error("Failed to load religious place record");
      }
    };

    loadSinglePlace();
  }, [id]);

  const loadPoliceStations = async () => {
    try {
      const res = await getPoliceStations();
      setPoliceStations(res.data.data || []);
    } catch {
      toast.error("Failed to load police stations");
    }
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
        address: data.display_name || prev.address,
        area:
          address.suburb ||
          address.neighbourhood ||
          address.road ||
          address.village ||
          address.town ||
          prev.area,
        taluka:
          address.county ||
          address.city_district ||
          address.municipality ||
          prev.taluka,
        district: address.state_district || address.county || prev.district,
        state: address.state || prev.state,
        pincode: address.postcode || prev.pincode,
      }));
    } catch {
      toast.error("Address auto-fill failed. Enter details manually.");
    }
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location not supported on this device");
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
        toast.success("GPS Location detected");
        setLocationLoading(false);
      },
      () => {
        toast.error("Please enable location permission");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP photos are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size must be under 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.place_name.trim()) {
      toast.error("Religious Place Name is required");
      return;
    }

    if (!form.area.trim()) {
      toast.error("Area / Ward is required");
      return;
    }

    if (!form.contact_mobile.trim()) {
      toast.error("Contact Number is required");
      return;
    }

    if (!form.latitude || !form.longitude) {
      toast.error("Please detect location coordinates");
      return;
    }

    try {
      setLoading(true);

      // Perform duplicate location check when creating new place
      if (!isEditMode) {
        try {
          const dupRes = await checkDuplicatePlace({
            latitude: form.latitude,
            longitude: form.longitude,
            place_name: form.place_name,
          });

          if (dupRes.data?.data?.isDuplicate) {
            setLoading(false);
            setDuplicateModalData(dupRes.data.data.existingPlace);
            return;
          }
        } catch (dupErr) {
          console.warn("Duplicate check warning:", dupErr);
        }
      }

      const isCctv = cctvAvailable === "Yes";
      const countVal = isCctv ? parseInt(form.cctv_count || "0", 10) : 0;

      const payloadData = {
        ...form,
        cctv_available: isCctv,
        cctv_count: countVal,
        camera_available: isCctv,
        camera_count: countVal,
        trust_management_name: form.president_name || "",
        alternate_mobile: form.secretary_name || "",
        notes: form.sensitive_notes || "",
      };

      const formData = new FormData();
      Object.keys(payloadData).forEach((key) => {
        formData.append(key, payloadData[key]);
      });

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (isEditMode) {
        await updateReligiousPlace(id, payloadData);
        toast.success("Religious Place Updated Successfully");
      } else {
        await createReligiousPlace(formData);
        toast.success("Religious Place Saved Successfully");
      }

      navigate("/religious-places");
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("This religious place already exists");
      } else {
        toast.error(error.response?.data?.message || "Failed to save religious place");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecordVisitSubmit = async (e) => {
    e.preventDefault();
    if (!duplicateModalData?.id) return;
    try {
      setSavingVisit(true);
      await recordPlaceVisit({
        place_id: duplicateModalData.id,
        entity_type: "religious_place",
        notes: visitNotes || "Officer verification visit recorded",
        photo: imagePreview || null,
      });
      toast.success("Verification Visit Recorded Successfully");
      setShowVisitModal(false);
      setDuplicateModalData(null);
      navigate("/religious-places");
    } finally {
      setSavingVisit(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {isEditMode ? "Edit Religious Place" : "Add Religious Place"}
          </h2>
          <p className="page-subtitle">
            Register permanent religious places with live GPS coordinates, security data and contact details.
          </p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={detectCurrentLocation}
          disabled={locationLoading}
        >
          <Navigation size={18} />
          {locationLoading ? "Detecting..." : "Detect Current Location"}
        </button>
      </div>

      {form.latitude && form.longitude && (
        <div className="selected-location-box">
          <MapPin size={20} />
          <div>
            <h4>GPS Coordinates Verified</h4>
            <p>
              Latitude: {form.latitude} • Longitude: {form.longitude}
            </p>
          </div>
        </div>
      )}

      <form className="enterprise-form" onSubmit={handleSubmit}>
        {/* SECTION 1: BASIC INFORMATION */}
        <section className="form-section">
          <div className="section-title">
            <Building2 size={20} />
            <div>
              <h3>SECTION 1 — BASIC INFORMATION</h3>
              <p>Primary place identification, religion, type and address</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Religious Place Name *</label>
              <input
                type="text"
                name="place_name"
                value={form.place_name}
                onChange={handleChange}
                placeholder="Enter temple / masjid / dargah name"
                required
              />
            </div>

            <div className="form-group">
              <label>Religion *</label>
              <select name="religion" value={form.religion} onChange={handleChange}>
                <option value="Hindu">Hindu</option>
                <option value="Muslim">Muslim</option>
                <option value="Christian">Christian</option>
                <option value="Sikh">Sikh</option>
                <option value="Jain">Jain</option>
                <option value="Buddhist">Buddhist</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Place Type *</label>
              <select name="place_type" value={form.place_type} onChange={handleChange}>
                <option value="Temple">Temple / Mandir</option>
                <option value="Masjid">Masjid / Mosque</option>
                <option value="Dargah">Dargah</option>
                <option value="Gurudwara">Gurudwara</option>
                <option value="Church">Church</option>
                <option value="Math">Math</option>
                <option value="Ashram">Ashram</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Area / Ward *</label>
              <input
                type="text"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="Enter area or ward name"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Full Address *</label>
              <textarea
                name="address"
                rows={2}
                value={form.address}
                onChange={handleChange}
                placeholder="Street address details..."
                required
              />
            </div>

            <div className="form-group">
              <label>Landmark / Ward Details</label>
              <input
                type="text"
                name="ward"
                value={form.ward}
                onChange={handleChange}
                placeholder="Nearby landmark or ward number"
              />
            </div>

            <div className="form-group">
              <label>Pincode</label>
              <input
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="423203"
              />
            </div>

            <div className="form-group">
              <label>Taluka / City</label>
              <input
                type="text"
                name="taluka"
                value={form.taluka}
                onChange={handleChange}
                placeholder="Malegaon"
              />
            </div>

            <div className="form-group">
              <label>District</label>
              <input
                type="text"
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="Nashik"
              />
            </div>

            <div className="form-group">
              <label>Assigned Police Station</label>
              <select
                name="police_station"
                value={form.police_station}
                onChange={handleChange}
              >
                <option value="">Select Police Station</option>
                {policeStations.map((station) => (
                  <option key={station.id} value={station.station_name}>
                    {station.station_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 2: RESPONSIBLE PERSON / CONTACT */}
        <section className="form-section">
          <div className="section-title">
            <Users size={20} />
            <div>
              <h3>SECTION 2 — RESPONSIBLE PERSON / CONTACT</h3>
              <p>Trust, committee management and contact details</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Trust / Organization Name</label>
              <input
                type="text"
                name="president_name"
                value={form.president_name}
                onChange={handleChange}
                placeholder="Enter trust / committee name"
              />
            </div>

            <div className="form-group">
              <label>Trustee / Responsible Person Name</label>
              <input
                type="text"
                name="contact_person"
                value={form.contact_person}
                onChange={handleChange}
                placeholder="Primary responsible person"
              />
            </div>

            <div className="form-group">
              <label>Primary Contact Number *</label>
              <input
                type="tel"
                name="contact_mobile"
                value={form.contact_mobile}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                required
              />
            </div>

            <div className="form-group">
              <label>Alternate Contact Number</label>
              <input
                type="tel"
                name="secretary_name"
                value={form.secretary_name}
                onChange={handleChange}
                placeholder="Alternate phone number"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: LOCATION DETAILS */}
        <section className="form-section">
          <div className="section-title">
            <MapPin size={20} />
            <div>
              <h3>SECTION 3 — LOCATION DETAILS</h3>
              <p>GPS coordinates for GIS map positioning</p>
            </div>
          </div>

          <div className="form-grid">
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

        {/* SECTION 4: SECURITY & CCTV DETAILS */}
        <section className="form-section">
          <div className="section-title">
            <ShieldAlert size={20} />
            <div>
              <h3>SECTION 4 — SECURITY & CCTV DETAILS</h3>
              <p>CCTV surveillance cameras, crowd density and security level</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Risk Level</label>
              <select name="risk_level" value={form.risk_level} onChange={handleChange}>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>

            <div className="form-group">
              <label>Regular Crowd Density</label>
              <select name="regular_crowd" value={form.regular_crowd} onChange={handleChange}>
                <option value="Low">Low (0 - 100)</option>
                <option value="Medium">Medium (100 - 500)</option>
                <option value="High">High (500+)</option>
              </select>
            </div>

            <div className="form-group">
              <label>CCTV Available?</label>
              <select
                value={cctvAvailable}
                onChange={(e) => setCctvAvailable(e.target.value)}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {cctvAvailable === "Yes" && (
              <div className="form-group">
                <label>Number of CCTV Cameras</label>
                <input
                  type="number"
                  name="cctv_count"
                  value={form.cctv_count}
                  onChange={handleChange}
                  placeholder="e.g. 4"
                />
              </div>
            )}
          </div>
        </section>

        {/* SECTION 5: RISK / ADDITIONAL INFORMATION */}
        <section className="form-section">
          <div className="section-title">
            <ShieldAlert size={20} />
            <div>
              <h3>SECTION 5 — RISK / ADDITIONAL INFORMATION</h3>
              <p>Sensitive police observations, remarks and advisories</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label>Police Notes & Remarks</label>
              <textarea
                name="sensitive_notes"
                rows={3}
                value={form.sensitive_notes}
                onChange={handleChange}
                placeholder="Police security notes, remarks or advisories..."
              />
            </div>
          </div>
        </section>

        {/* SECTION 6: PHOTO / DOCUMENTATION */}
        <section className="form-section">
          <div className="section-title">
            <Camera size={20} />
            <div>
              <h3>SECTION 6 — PHOTO / DOCUMENTATION</h3>
              <p>Upload a clear photo of the place building or entrance</p>
            </div>
          </div>

          <div className="photo-upload-card">
            {!imagePreview ? (
              <div className="photo-upload-options-row">
                <label className="upload-box camera-option-box">
                  <Camera size={30} className="upload-icon-teal" />
                  <h4>Take Photo</h4>
                  <p>Capture using device camera</p>
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
                <img src={imagePreview} alt="Place Preview" />
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

        {/* FORM ACTIONS */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/religious-places")}
          >
            Cancel
          </button>

          <button type="submit" className="primary-btn" disabled={loading}>
            <Save size={18} />
            {loading
              ? "Saving Record..."
              : isEditMode
              ? "Update Religious Place"
              : "Save Religious Place"}
          </button>
        </div>
      </form>

      {/* DUPLICATE LOCATION WARNING MODAL */}
      {duplicateModalData && !showVisitModal && (
        <div className="modal-overlay">
          <div className="admin-modal-card">
            <div className="modal-header bg-amber-light">
              <div className="flex-items-center gap-2">
                <ShieldAlert size={22} className="text-amber" />
                <h3 className="text-amber">Already Registered Location</h3>
              </div>
            </div>

            <div className="p-4">
              <p className="mb-3">
                A master religious place record already exists at or near this location:
              </p>

              <div className="duplicate-details-card">
                {duplicateModalData.photo_url || duplicateModalData.image_url ? (
                  <img
                    src={duplicateModalData.photo_url || duplicateModalData.image_url}
                    alt={duplicateModalData.place_name}
                    className="duplicate-place-img"
                  />
                ) : null}

                <div className="duplicate-info">
                  <h4>{duplicateModalData.place_name}</h4>
                  <p className="text-muted">{duplicateModalData.place_type} • {duplicateModalData.address || duplicateModalData.area || "Chhavani"}</p>
                  <p className="small mt-2">
                    <b>Registered By:</b> {duplicateModalData.creator_name || "Police Officer"}
                    <br />
                    <b>Total Visits:</b> {duplicateModalData.visit_count || 1}
                  </p>
                </div>
              </div>

              <div className="modal-actions mt-4">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setDuplicateModalData(null);
                    navigate("/religious-places");
                  }}
                >
                  [ View Existing Record ]
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => setShowVisitModal(true)}
                >
                  [ Add Verification / Visit ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECORD VISIT VERIFICATION MODAL */}
      {duplicateModalData && showVisitModal && (
        <div className="modal-overlay">
          <div className="admin-modal-card compact">
            <div className="modal-header">
              <h3>Record Verification / Visit</h3>
            </div>

            <form onSubmit={handleRecordVisitSubmit} className="admin-form p-4">
              <p className="text-muted mb-3">
                Recording secondary officer visit for <b>{duplicateModalData.place_name}</b>:
              </p>

              <div className="form-group">
                <label>Visit Notes / Observations</label>
                <textarea
                  rows="3"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Enter visit verification notes..."
                  required
                ></textarea>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setShowVisitModal(false);
                    setDuplicateModalData(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={savingVisit}>
                  {savingVisit ? "Recording Visit..." : "Submit Verification Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddReligiousPlace;