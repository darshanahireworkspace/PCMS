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
            place_type: form.place_type,
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
        const detailErr = error.response?.data?.error || error.response?.data?.message || error.message;
        toast.error(detailErr ? `Unable to save place: ${detailErr}` : "Failed to save religious place");
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
            {isEditMode ? "धार्मिक स्थळ संपादित करा" : "नवीन धार्मिक स्थळ जोडा"}
          </h2>
          <p className="page-subtitle">
            शहरातील मंदिरे, मशिदी, दर्गा व इतर धार्मिक स्थळांची अचूक माहिती, संपर्क व्यक्ती, जीपीएस (GPS) स्थान व सुरक्षा तपशील नोंदवा.
          </p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={detectCurrentLocation}
          disabled={locationLoading}
        >
          <Navigation size={18} />
          {locationLoading ? "स्थान शोधत आहे..." : "सध्याचे स्थान मिळवा (GPS)"}
        </button>
      </div>

      {form.latitude && form.longitude && (
        <div className="selected-location-box">
          <MapPin size={20} />
          <div>
            <h4>जीपीएस स्थान निश्चित झाले (GPS Verified)</h4>
            <p>
              अक्षांश (Latitude): {form.latitude} • रेखांश (Longitude): {form.longitude}
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
              <h3>विभाग १ — प्राथमिक माहिती (Basic Details)</h3>
              <p>धार्मिक स्थळाचे नाव, धर्म, प्रकार व पूर्ण पत्ता</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>धार्मिक स्थळाचे नाव *</label>
              <input
                type="text"
                name="place_name"
                value={form.place_name}
                onChange={handleChange}
                placeholder="उदा. श्री सिद्धिविनायक मंदिर / जामा मशीद / दर्गा"
                required
              />
            </div>

            <div className="form-group">
              <label>धर्म *</label>
              <select name="religion" value={form.religion} onChange={handleChange}>
                <option value="Hindu">हिंदू (Hindu)</option>
                <option value="Muslim">मुस्लिम (Muslim)</option>
                <option value="Christian">ख्रिश्चन (Christian)</option>
                <option value="Sikh">शीख (Sikh)</option>
                <option value="Jain">जैन (Jain)</option>
                <option value="Buddhist">बौद्ध (Buddhist)</option>
                <option value="Other">इतर (Other)</option>
              </select>
            </div>

            <div className="form-group">
              <label>स्थळाचा प्रकार *</label>
              <select name="place_type" value={form.place_type} onChange={handleChange}>
                <option value="Temple">मंदिर (Temple / Mandir)</option>
                <option value="Masjid">मशीद (Masjid / Mosque)</option>
                <option value="Dargah">दर्गा (Dargah / Peer)</option>
                <option value="Gurudwara">गुरुद्वारा (Gurudwara)</option>
                <option value="Church">चर्च (Church)</option>
                <option value="Math">मठ (Math)</option>
                <option value="Ashram">आश्रम (Ashram)</option>
                <option value="Other">इतर (Other)</option>
              </select>
            </div>

            <div className="form-group">
              <label>परिसर / प्रभाग *</label>
              <input
                type="text"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="उदा. छावणी, कॅम्प, जुना बाजार, प्रभाग क्र."
                required
              />
            </div>

            <div className="form-group full-width">
              <label>पूर्ण पत्ता *</label>
              <textarea
                name="address"
                rows={2}
                value={form.address}
                onChange={handleChange}
                placeholder="गल्ली, रस्त्याचे नाव, परिसराचा सविस्तर पत्ता..."
                required
              />
            </div>

            <div className="form-group">
              <label>जवळची खूण / लँडमार्क</label>
              <input
                type="text"
                name="ward"
                value={form.ward}
                onChange={handleChange}
                placeholder="उदा. मुख्य चौकाजवळ, सरकारी दवाखान्यासमोर"
              />
            </div>

            <div className="form-group">
              <label>पिनकोड</label>
              <input
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="४२३२०३"
              />
            </div>

            <div className="form-group">
              <label>तालुका / शहर</label>
              <input
                type="text"
                name="taluka"
                value={form.taluka}
                onChange={handleChange}
                placeholder="मालेगाव"
              />
            </div>

            <div className="form-group">
              <label>जिल्हा</label>
              <input
                type="text"
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="नाशिक"
              />
            </div>

            <div className="form-group">
              <label>संबंधित पोलीस ठाणे *</label>
              <select
                name="police_station"
                value={form.police_station}
                onChange={handleChange}
              >
                <option value="">पोलीस ठाणे निवडा</option>
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
              <h3>विभाग २ — विश्वस्त / जबाबदार व्यक्ती व संपर्क तपशील</h3>
              <p>ट्रस्ट, कमिटी, मंडळ व मुख्य पदाधिकाऱ्यांची माहिती</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>ट्रस्ट / मंडळाचे नाव</label>
              <input
                type="text"
                name="president_name"
                value={form.president_name}
                onChange={handleChange}
                placeholder="उदा. श्री गणेश मंदिर ट्रस्ट / मशीद कमिटी"
              />
            </div>

            <div className="form-group">
              <label>मुख्य विश्वस्त / जबाबदार व्यक्तीचे नाव</label>
              <input
                type="text"
                name="contact_person"
                value={form.contact_person}
                onChange={handleChange}
                placeholder="अध्यक्ष / मुख्य व्यवस्थापकाचे नाव"
              />
            </div>

            <div className="form-group">
              <label>मुख्य मोबाईल नंबर *</label>
              <input
                type="tel"
                name="contact_mobile"
                value={form.contact_mobile}
                onChange={handleChange}
                placeholder="१० अंकी मोबाईल नंबर"
                required
              />
            </div>

            <div className="form-group">
              <label>पर्यायी मोबाईल नंबर / सचिव</label>
              <input
                type="tel"
                name="secretary_name"
                value={form.secretary_name}
                onChange={handleChange}
                placeholder="दुसरा संपर्क क्रमांक किंवा सचिवाची माहिती"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: LOCATION DETAILS */}
        <section className="form-section">
          <div className="section-title">
            <MapPin size={20} />
            <div>
              <h3>विभाग ३ — जीपीएस (GPS) स्थान तपशील</h3>
              <p>नकाशावर (GIS Map) अचूक स्थान दाखवण्यासाठी अक्षांश व रेखांश</p>
            </div>
          </div>

          <div className="form-grid">
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

        {/* SECTION 4: SECURITY & CCTV DETAILS */}
        <section className="form-section">
          <div className="section-title">
            <ShieldAlert size={20} />
            <div>
              <h3>विभाग ४ — सुरक्षा व सीसीटीव्ही (CCTV) तपशील</h3>
              <p>सुरक्षा कॅमेरे, गर्दीचे प्रमाण व संवेदनशीलता पातळी</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>धोका पातळी / संवेदनशीलता</label>
              <select name="risk_level" value={form.risk_level} onChange={handleChange}>
                <option value="Low">सामान्य / कमी धोका (Low Risk)</option>
                <option value="Medium">मध्यम संवेदनशीलता (Medium Risk)</option>
                <option value="High">अतिसंवेदनशील / उच्च धोका (High Risk)</option>
              </select>
            </div>

            <div className="form-group">
              <label>नियमित गर्दीचे प्रमाण</label>
              <select name="regular_crowd" value={form.regular_crowd} onChange={handleChange}>
                <option value="Low">कमी (० ते १०० भाविक)</option>
                <option value="Medium">मध्यम (१०० ते ५०० भाविक)</option>
                <option value="High">जास्त (५०० पेक्षा जास्त भाविक)</option>
              </select>
            </div>

            <div className="form-group">
              <label>सीसीटीव्ही (CCTV) कॅमेरे आहेत का?</label>
              <select
                value={cctvAvailable}
                onChange={(e) => setCctvAvailable(e.target.value)}
              >
                <option value="No">नाही (No)</option>
                <option value="Yes">होय (Yes)</option>
              </select>
            </div>

            {cctvAvailable === "Yes" && (
              <div className="form-group">
                <label>सीसीटीव्ही कॅमेऱ्यांची संख्या</label>
                <input
                  type="number"
                  name="cctv_count"
                  value={form.cctv_count}
                  onChange={handleChange}
                  placeholder="उदा. ४"
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
              <h3>विभाग ५ — पोलीस शेरा व गोपनीय माहिती</h3>
              <p>संवेदनशील नोंदी, पूर्वीचे वाद किंवा पोलिसांच्या विशेष सूचना</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label>पोलीस नोंदी / गोपनीय शेरा</label>
              <textarea
                name="sensitive_notes"
                rows={3}
                value={form.sensitive_notes}
                onChange={handleChange}
                placeholder="धार्मिक स्थळाबाबत विशेष माहिती, कायदा व सुव्यवस्था संदर्भातील सूचना लिहा..."
              />
            </div>
          </div>
        </section>

        {/* SECTION 6: PHOTO / DOCUMENTATION */}
        <section className="form-section">
          <div className="section-title">
            <Camera size={20} />
            <div>
              <h3>विभाग ६ — स्थळाचा फोटो (Photo Upload)</h3>
              <p>धार्मिक स्थळाच्या मुख्य इमारतीचा किंवा प्रवेशद्वाराचा स्पष्ट फोटो जोडा</p>
            </div>
          </div>

          <div className="photo-upload-card">
            {!imagePreview ? (
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
                <img src={imagePreview} alt="Place Preview" />
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

        {/* FORM ACTIONS */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/religious-places")}
          >
            रद्द करा (Cancel)
          </button>

          <button type="submit" className="primary-btn" disabled={loading}>
            <Save size={18} />
            {loading
              ? "माहिती सेव्ह होत आहे..."
              : isEditMode
              ? "माहिती अपडेट करा"
              : "धार्मिक स्थळ सेव्ह करा"}
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
                <h3 className="text-amber">या ठिकाणी आधीच नोंदणी अस्तित्वात आहे</h3>
              </div>
            </div>

            <div className="p-4">
              <p className="mb-3">
                या स्थानावर किंवा जवळ आधीच मुख्य धार्मिक स्थळाची नोंद झालेली आहे:
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
                  <p className="text-muted">{duplicateModalData.place_type} • {duplicateModalData.address || duplicateModalData.area || "मालेगाव"}</p>
                  <p className="small mt-2">
                    <b>नोंदणी अधिकारी:</b> {duplicateModalData.creator_name || "पोलीस अधिकारी"}
                    <br />
                    <b>एकूण भेटी (Visits):</b> {duplicateModalData.visit_count || 1}
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
                  अस्तित्वातील रेकॉर्ड पहा
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => setShowVisitModal(true)}
                >
                  नवीन भेट / पडताळणी जोडा
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
              <h3>भेट व पडताळणी नोंदवा (Verification Visit)</h3>
            </div>

            <form onSubmit={handleRecordVisitSubmit} className="admin-form p-4">
              <p className="text-muted mb-3">
                <b>{duplicateModalData.place_name}</b> या स्थळाची पोलीस पडताळणी भेट नोंदवत आहात:
              </p>

              <div className="form-group">
                <label>पडताळणी शेरा व निरीक्षणे</label>
                <textarea
                  rows="3"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="पडताळणी शेरा, सुरक्षा स्थिती, उपस्थित व्यक्ती इत्यादी माहिती लिहा..."
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
                  रद्द करा
                </button>
                <button type="submit" className="primary-btn" disabled={savingVisit}>
                  {savingVisit ? "नोंदवत आहे..." : "पडताळणी भेट सेव्ह करा"}
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