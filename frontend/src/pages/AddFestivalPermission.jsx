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
            {isEditMode ? "उत्सव परवानगी संपादित करा" : "नवीन सण / उत्सव परवानगी जोडा"}
          </h2>
          <p className="page-subtitle">
            मंडळाची माहिती, विसर्जन/मिरवणूक मार्ग, ध्वनिक्षेपक परवानगी व पोलीस पडताळणी तपशील नोंदवा.
          </p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={detectCurrentLocation}
          disabled={locationLoading}
        >
          <Navigation size={18} />
          {locationLoading ? "स्थान शोधत आहे..." : "मंडपाचे GPS स्थान मिळवा"}
        </button>
      </div>

      {form.latitude && form.longitude && (
        <div className="selected-location-box">
          <MapPin size={20} />
          <div>
            <h4>उत्सव ठिकाण GPS निश्चित झाले</h4>
            <p>
              अक्षांश (Latitude): {form.latitude} • रेखांश (Longitude): {form.longitude}
            </p>
          </div>
        </div>
      )}

      {selectedPlace && (
        <div className="selected-location-box">
          <MapPin size={20} />
          <div>
            <h4>संबंधित कायमस्वरूपी धार्मिक स्थळ</h4>
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
              <h3>विभाग १ — सण व उत्सव प्राथमिक माहिती</h3>
              <p>उत्सवाचा प्रकार, वर्ष व मंडळाचे अधिकृत नाव</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>संबंधित धार्मिक स्थळ (ऐच्छिक)</label>
              <select
                name="religious_place_id"
                value={form.religious_place_id}
                onChange={handleChange}
              >
                <option value="">कोणतेही कायमस्वरूपी स्थळ जोडलेले नाही</option>
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.place_name} ({place.place_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>उत्सवाचे नाव *</label>
              <select
                name="festival_name"
                value={form.festival_name}
                onChange={handleChange}
              >
                <option value="Ganesh Utsav">गणेशोत्सव (Ganesh Utsav)</option>
                <option value="Navratri">नवरात्रौत्सव (Navratri)</option>
                <option value="Jayanti">जयंती उत्सव (Jayanti)</option>
                <option value="Holi">होळी / धुलीवंदन (Holi)</option>
                <option value="Eid">ईद (Eid)</option>
                <option value="Urs">उरूस (Urs)</option>
                <option value="Muharram">मोहर्रम (Muharram)</option>
                <option value="Ram Navami">राम नवमी (Ram Navami)</option>
                <option value="Christmas">नाताळ / ख्रिसमस (Christmas)</option>
                <option value="Other">इतर उत्सव (Other)</option>
              </select>
            </div>

            <div className="form-group">
              <label>मंडळ / आयोजक संस्थेचे नाव *</label>
              <input
                type="text"
                name="organizer_name"
                value={form.organizer_name}
                onChange={handleChange}
                placeholder="उदा. जय गणेश मित्र मंडळ"
                required
              />
            </div>

            <div className="form-group">
              <label>उत्सवाचे वर्ष</label>
              <input
                type="number"
                name="festival_year"
                value={form.festival_year}
                onChange={handleChange}
                placeholder="२०२६"
              />
            </div>

            <div className="form-group">
              <label>सुरुवात दिनांक</label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>समाप्ती दिनांक</label>
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
              <h3>विभाग २ — मंडळ पदाधिकारी व जबाबदार व्यक्ती</h3>
              <p>अध्यक्ष, उपाध्यक्ष, सचिव व मुख्य कार्यकर्त्यांची संपर्क माहिती</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>अध्यक्ष / मुख्य आयोजकाचे नाव *</label>
              <input
                type="text"
                name="president_name"
                value={form.president_name}
                onChange={handleChange}
                placeholder="अध्यक्षांचे पूर्ण नाव"
                required
              />
            </div>

            <div className="form-group">
              <label>अध्यक्षांचा मोबाईल नंबर *</label>
              <input
                type="tel"
                name="president_mobile"
                value={form.president_mobile}
                onChange={handleChange}
                placeholder="१० अंकी मोबाईल नंबर"
                required
              />
            </div>

            <div className="form-group">
              <label>उपाध्यक्ष / सचिवांचे नाव</label>
              <input
                type="text"
                name="secretary_name"
                value={form.secretary_name}
                onChange={handleChange}
                placeholder="सचिवांचे पूर्ण नाव"
              />
            </div>

            <div className="form-group">
              <label>सचिवांचा मोबाईल नंबर</label>
              <input
                type="tel"
                name="secretary_mobile"
                value={form.secretary_mobile}
                onChange={handleChange}
                placeholder="१० अंकी मोबाईल नंबर"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: PERMISSION DETAILS */}
        <section className="form-section">
          <div className="section-title">
            <ShieldAlert size={20} />
            <div>
              <h3>विभाग ३ — पोलीस परवानगी व तपासणी स्थिती</h3>
              <p>ध्वनिक्षेपक (Loudspeaker) व मिरवणूक परवानगी आणि पडताळणी</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>ध्वनिक्षेपक / लाऊडस्पीकर परवानगी</label>
              <select
                name="sound_permission"
                value={form.sound_permission}
                onChange={handleChange}
              >
                <option value="No">नाही (No)</option>
                <option value="Yes">होय (Yes)</option>
              </select>
            </div>

            <div className="form-group">
              <label>मिरवणूक (विसर्जन) परवानगी</label>
              <select
                name="procession"
                value={form.procession}
                onChange={handleChange}
              >
                <option value="No">नाही (No)</option>
                <option value="Yes">होय (Yes)</option>
              </select>
            </div>

            <div className="form-group">
              <label>परवानगी स्थिती (Permission Status)</label>
              <select
                name="permission_status"
                value={form.permission_status}
                onChange={handleChange}
              >
                <option value="Pending">प्रलंबित (Pending)</option>
                <option value="Approved">मंजूर (Approved)</option>
                <option value="Rejected">नाकारले (Rejected)</option>
              </select>
            </div>

            <div className="form-group">
              <label>पोलीस पडताळणी स्थिती (Verification Status)</label>
              <select
                name="verification_status"
                value={form.verification_status}
                onChange={handleChange}
              >
                <option value="Pending">पडताळणी बाकी (Pending)</option>
                <option value="Verified">पडताळणी पूर्ण (Verified)</option>
                <option value="Rejected">अपात्र (Rejected)</option>
              </select>
            </div>

            <div className="form-group">
              <label>अपेक्षित गर्दीचे प्रमाण</label>
              <input
                type="number"
                name="expected_crowd"
                value={form.expected_crowd}
                onChange={handleChange}
                placeholder="उदा. ५००"
              />
            </div>

            <div className="form-group">
              <label>धोका पातळी / संवेदनशीलता</label>
              <select
                name="risk_level"
                value={form.risk_level}
                onChange={handleChange}
              >
                <option value="Low">सामान्य / कमी धोका (Low Risk)</option>
                <option value="Medium">मध्यम संवेदनशीलता (Medium Risk)</option>
                <option value="High">अतिसंवेदनशील / उच्च धोका (High Risk)</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 4: PROCESSION / ROUTE */}
        <section className="form-section">
          <div className="section-title">
            <Route size={20} />
            <div>
              <h3>विभाग ४ — विसर्जन / मिरवणूक मार्ग (Procession Route)</h3>
              <p>मिरवणूक सुरू होण्याची वेळ, समाप्ती वेळ व मार्गाचा सविस्तर तपशील</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>मिरवणूक सुरू होण्याची वेळ</label>
              <input
                type="time"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>मिरवणूक समाप्ती वेळ</label>
              <input
                type="time"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>मिरवणूक मार्गाचा सविस्तर तपशील</label>
              <textarea
                name="route_details"
                rows={2}
                value={form.route_details}
                onChange={handleChange}
                placeholder="सुरुवात ठिकाण -> चौक / मार्ग -> विसर्जन घाट / शेवटचे ठिकाण..."
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: ADDITIONAL INFORMATION */}
        <section className="form-section">
          <div className="section-title">
            <ShieldAlert size={20} />
            <div>
              <h3>विभाग ५ — पोलीस अटी, शर्ती व विशेष शेरा</h3>
              <p>कायदा व सुव्यवस्था राखण्यासाठी पोलिसांच्या सूचना व अटी</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label>पोलीस शेरा व अटी/शर्ती</label>
              <textarea
                name="police_notes"
                rows={3}
                value={form.police_notes}
                onChange={handleChange}
                placeholder="पोलीस पडताळणी शेरा, स्वयंसेवक संख्या किंवा घातलेल्या अटी लिहा..."
              />
            </div>
          </div>
        </section>

        {/* SECTION 6: PHOTO */}
        <section className="form-section">
          <div className="section-title">
            <Camera size={20} />
            <div>
              <h3>विभाग ६ — मंडप / स्टेजचा फोटो</h3>
              <p>मंडपाचा किंवा परवानगी अर्जाचा स्पष्ट फोटो जोडा</p>
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
                <img src={photoPreview} alt="Festival Preview" />
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

        {/* SECTION 7: LOCATION */}
        <section className="form-section">
          <div className="section-title">
            <MapPin size={20} />
            <div>
              <h3>विभाग ७ — मंडपाचे ठिकाण व पत्ता</h3>
              <p>मंडप उभारणीचे ठिकाण व नकाशासाठी जीपीएस (GPS) स्थान</p>
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
                placeholder="उदा. रविवार पेठ, छावणी"
              />
            </div>

            <div className="form-group full-width">
              <label>मंडपाचा पूर्ण पत्ता</label>
              <textarea
                name="address"
                rows={2}
                value={form.address}
                onChange={handleChange}
                placeholder="मंडप उभारणीचा सविस्तर रस्ता व पत्ता..."
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

        {/* FORM ACTIONS */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/festival-permissions")}
          >
            रद्द करा (Cancel)
          </button>

          <button type="submit" className="primary-btn" disabled={loading}>
            <Save size={18} />
            {loading
              ? "परवानगी सेव्ह होत आहे..."
              : isEditMode
              ? "परवानगी माहिती अपडेट करा"
              : "उत्सव परवानगी सेव्ह करा"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddFestivalPermission;