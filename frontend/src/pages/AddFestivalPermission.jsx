import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarCheck,
  Users,
  MapPin,
  Volume2,
  Route,
  ShieldAlert,
  Save,
  Navigation,
  Upload,
  Camera,
  RefreshCw,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { getReligiousPlaces } from "../api/religiousPlaceApi";
import {
  createFestivalPermission,
  getSingleFestivalPermission,
  updateFestivalPermission,
} from "../api/festivalApi";

function AddFestivalPermission() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [form, setForm] = useState({
    religious_place_id: "",
    festival_name: "Ganesh Utsav",
    festival_year: new Date().getFullYear(),
    organizer_name: "",
    president_name: "",
    president_mobile: "",
    secretary_name: "",
    secretary_mobile: "",
    permission_number: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    expected_crowd: "",
    sound_permission: "No",
    procession: "No",
    route_details: "",
    address: "",
    area: "",
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    google_map_link: "",
    verification_status: "Pending",
    permission_status: "Pending",
    risk_level: "Low",
    police_notes: "",
  });

  useEffect(() => {
    fetchPlaces();
    if (!id) {
      detectCurrentLocation();
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadFestival();
    }
  }, [id]);

  const loadFestival = async () => {
    try {
      const res = await getSingleFestivalPermission(id);
      const data = res.data.data;

      setForm({
        religious_place_id: data.religious_place_id || "",
        festival_name: data.festival_name || "Ganesh Utsav",
        festival_year: data.festival_year || new Date().getFullYear(),
        organizer_name: data.organizer_name || data.mandal_name || "",
        president_name: data.president_name || "",
        president_mobile: data.president_mobile || data.mobile || "",
        secretary_name: data.secretary_name || "",
        secretary_mobile: data.secretary_mobile || "",
        permission_number: data.permission_number || "",
        start_date: data.start_date || data.date || "",
        end_date: data.end_date || "",
        start_time: data.start_time || data.time || "",
        end_time: data.end_time || "",
        expected_crowd: data.expected_crowd || data.crowd || "",
        sound_permission: data.sound_permission ? "Yes" : "No",
        procession: data.procession ? "Yes" : "No",
        route_details: data.route_details || "",
        address: data.address || "",
        area: data.area || "",
        taluka: data.taluka || "",
        district: data.district || "",
        state: data.state || "",
        pincode: data.pincode || "",
        latitude: data.latitude || "",
        longitude: data.longitude || "",
        google_map_link: data.google_map_link || "",
        verification_status: data.verification_status || "Pending",
        permission_status: data.permission_status || "Pending",
        risk_level: data.risk_level || "Low",
        police_notes: data.police_notes || data.notes || "",
      });

      const existingPhoto = data.photo_url || data.photo || data.image || "";
      if (existingPhoto) {
        setPhotoPreview(existingPhoto);
      }
    } catch {
      toast.error("Failed to load festival permission details");
    }
  };

  const fetchPlaces = async () => {
    try {
      const res = await getReligiousPlaces();
      setPlaces(res.data.data || []);
    } catch {
      toast.error("Failed to load religious places");
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
        address: data.display_name || "",
        area:
          address.suburb ||
          address.neighbourhood ||
          address.road ||
          address.village ||
          address.town ||
          "",
        taluka:
          address.county ||
          address.city_district ||
          address.municipality ||
          "",
        district: address.state_district || address.county || "",
        state: address.state || "",
        pincode: address.postcode || "",
      }));
    } catch {
      toast.error("Address auto-fill failed");
    }
  };

  const detectCurrentLocation = () => {
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
        toast.success("Festival location detected");
        setLocationLoading(false);
      },
      () => {
        toast.error("Please allow location permission");
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
      toast.error("Only JPG, PNG or WEBP photos allowed");
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.organizer_name.trim()) {
      toast.error("Mandal / Organizer Name is required");
      return;
    }

    if (!form.president_name.trim()) {
      toast.error("Adhyaksha / President Name is required");
      return;
    }

    if (!form.president_mobile.trim()) {
      toast.error("President Mobile Number is required");
      return;
    }

    if (!form.latitude || !form.longitude) {
      toast.error("Please detect event location coordinates");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        const val = form[key];
        if (key === "religious_place_id") {
          const cleanId = typeof val === "string" ? val.trim() : "";
          if (cleanId) {
            formData.append(key, cleanId);
          }
          return;
        }
        formData.append(key, val);
      });

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      if (isEditMode) {
        await updateFestivalPermission(id, formData);
        toast.success("Festival Permission Updated Successfully");
      } else {
        await createFestivalPermission(formData);
        toast.success("Festival Permission Saved Successfully");
      }

      navigate("/festival-permissions");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save permission");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlace = places.find(
    (p) => String(p.id) === String(form.religious_place_id)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {isEditMode ? "Edit Festival Permission" : "Add Festival Permission"}
          </h2>
          <p className="page-subtitle">
            Register mandal permissions, procession routes, sound permits and police verification.
          </p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={detectCurrentLocation}
          disabled={locationLoading}
        >
          <Navigation size={18} />
          {locationLoading ? "Detecting..." : "Detect Event Location"}
        </button>
      </div>

      {form.latitude && form.longitude && (
        <div className="selected-location-box">
          <MapPin size={20} />
          <div>
            <h4>Festival Coordinates Detected</h4>
            <p>
              Latitude: {form.latitude} • Longitude: {form.longitude}
            </p>
          </div>
        </div>
      )}

      {selectedPlace && (
        <div className="selected-location-box">
          <MapPin size={20} />
          <div>
            <h4>Linked Permanent Religious Place</h4>
            <p>
              {selectedPlace.place_name} • {selectedPlace.place_type} • {selectedPlace.area || "-"}
            </p>
          </div>
        </div>
      )}

      <form className="enterprise-form" onSubmit={handleSubmit}>
        {/* SECTION 1: FESTIVAL INFORMATION */}
        <section className="form-section">
          <div className="section-title">
            <CalendarCheck size={20} />
            <div>
              <h3>SECTION 1 — FESTIVAL INFORMATION</h3>
              <p>Festival classification, year and mandal identification</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Linked Religious Place (Optional)</label>
              <select
                name="religious_place_id"
                value={form.religious_place_id}
                onChange={handleChange}
              >
                <option value="">No permanent place linked</option>
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.place_name} ({place.place_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Festival Name *</label>
              <select
                name="festival_name"
                value={form.festival_name}
                onChange={handleChange}
              >
                <option value="Ganesh Utsav">Ganesh Utsav</option>
                <option value="Navratri">Navratri</option>
                <option value="Jayanti">Jayanti</option>
                <option value="Holi">Holi</option>
                <option value="Eid">Eid</option>
                <option value="Urs">Urs</option>
                <option value="Muharram">Muharram</option>
                <option value="Ram Navami">Ram Navami</option>
                <option value="Christmas">Christmas</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Mandal / Organizer Name *</label>
              <input
                type="text"
                name="organizer_name"
                value={form.organizer_name}
                onChange={handleChange}
                placeholder="e.g. Jai Ganesh Mitra Mandal"
                required
              />
            </div>

            <div className="form-group">
              <label>Festival Year</label>
              <input
                type="number"
                name="festival_year"
                value={form.festival_year}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: MANDAL / ORGANIZER INFORMATION */}
        <section className="form-section">
          <div className="section-title">
            <Users size={20} />
            <div>
              <h3>SECTION 2 — MANDAL / ORGANIZER INFORMATION</h3>
              <p>Adhyaksh, vice president and responsible committee members</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>President / Adhyaksh Name *</label>
              <input
                type="text"
                name="president_name"
                value={form.president_name}
                onChange={handleChange}
                placeholder="Enter president full name"
                required
              />
            </div>

            <div className="form-group">
              <label>President Mobile Number *</label>
              <input
                type="tel"
                name="president_mobile"
                value={form.president_mobile}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                required
              />
            </div>

            <div className="form-group">
              <label>Vice President / Secretary Name</label>
              <input
                type="text"
                name="secretary_name"
                value={form.secretary_name}
                onChange={handleChange}
                placeholder="Enter secretary full name"
              />
            </div>

            <div className="form-group">
              <label>Secretary Mobile Number</label>
              <input
                type="tel"
                name="secretary_mobile"
                value={form.secretary_mobile}
                onChange={handleChange}
                placeholder="Mobile number"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: PERMISSION DETAILS */}
        <section className="form-section">
          <div className="section-title">
            <ShieldAlert size={20} />
            <div>
              <h3>SECTION 3 — PERMISSION DETAILS</h3>
              <p>Loudspeaker permits, procession approvals and verification status</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Sound / Loudspeaker Permission</label>
              <select
                name="sound_permission"
                value={form.sound_permission}
                onChange={handleChange}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="form-group">
              <label>Procession (Miravnuk) Permission</label>
              <select
                name="procession"
                value={form.procession}
                onChange={handleChange}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="form-group">
              <label>Permission Status</label>
              <select
                name="permission_status"
                value={form.permission_status}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label>Verification Status</label>
              <select
                name="verification_status"
                value={form.verification_status}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label>Expected Crowd Size</label>
              <input
                type="number"
                name="expected_crowd"
                value={form.expected_crowd}
                onChange={handleChange}
                placeholder="e.g. 500"
              />
            </div>

            <div className="form-group">
              <label>Risk Level</label>
              <select
                name="risk_level"
                value={form.risk_level}
                onChange={handleChange}
              >
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 4: PROCESSION / ROUTE */}
        <section className="form-section">
          <div className="section-title">
            <Route size={20} />
            <div>
              <h3>SECTION 4 — PROCESSION / ROUTE</h3>
              <p>Miravnuk procession route details and timing schedule</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Procession Start Time</label>
              <input
                type="time"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Procession End Time</label>
              <input
                type="time"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Procession Route Description</label>
              <textarea
                name="route_details"
                rows={2}
                value={form.route_details}
                onChange={handleChange}
                placeholder="Starting point -> Checkpoints -> Final destination / immersion spot..."
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: ADDITIONAL INFORMATION */}
        <section className="form-section">
          <div className="section-title">
            <ShieldAlert size={20} />
            <div>
              <h3>SECTION 5 — ADDITIONAL INFORMATION</h3>
              <p>Police notes, restrictions and compliance remarks</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label>Police Notes & Restrictions</label>
              <textarea
                name="police_notes"
                rows={3}
                value={form.police_notes}
                onChange={handleChange}
                placeholder="Police verification notes or conditions..."
              />
            </div>
          </div>
        </section>

        {/* SECTION 6: PHOTO */}
        <section className="form-section">
          <div className="section-title">
            <Camera size={20} />
            <div>
              <h3>SECTION 6 — PHOTO</h3>
              <p>Upload mandal / pandal photograph or document proof</p>
            </div>
          </div>

          <div className="photo-upload-card">
            {!photoPreview ? (
              <div className="photo-upload-options-row">
                <label className="upload-box camera-option-box">
                  <Camera size={30} className="upload-icon-teal" />
                  <h4>Take Photo</h4>
                  <p>Capture mandal using device camera</p>
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
                <img src={photoPreview} alt="Festival Preview" />
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

        {/* SECTION 7: LOCATION */}
        <section className="form-section">
          <div className="section-title">
            <MapPin size={20} />
            <div>
              <h3>SECTION 7 — LOCATION</h3>
              <p>GPS coordinates and area for mandal map location</p>
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
                placeholder="Mandal location area"
              />
            </div>

            <div className="form-group full-width">
              <label>Full Address</label>
              <textarea
                name="address"
                rows={2}
                value={form.address}
                onChange={handleChange}
                placeholder="Street address details..."
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

        {/* FORM ACTIONS */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/festival-permissions")}
          >
            Cancel
          </button>

          <button type="submit" className="primary-btn" disabled={loading}>
            <Save size={18} />
            {loading
              ? "Saving Permission..."
              : isEditMode
              ? "Update Festival Permission"
              : "Save Festival Permission"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddFestivalPermission;