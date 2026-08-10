import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import {
  Layers,
  Navigation,
  ShieldAlert,
  Search,
  Church,
  CalendarCheck,
  Store,
  MapPin,
  ExternalLink,
  Phone,
  Info,
  Radio,
} from "lucide-react";
import L from "leaflet";
import toast from "react-hot-toast";

import { getReligiousPlaces } from "../api/religiousPlaceApi";
import { getFestivalPermissions } from "../api/festivalApi";
import { getOtherPlaces } from "../api/otherPlaceApi";
import RecordDetailsModal from "../components/common/RecordDetailsModal";

const riskColor = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#ef4444",
};

const createPlaceIcon = (color) =>
  new L.DivIcon({
    className: "custom-risk-marker",
    html: `<div style="background:${color}" class="place-marker-dot"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const createFestivalIcon = () =>
  new L.DivIcon({
    className: "custom-risk-marker",
    html: `<div class="festival-marker-diamond"></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const createOtherIcon = () =>
  new L.DivIcon({
    className: "custom-risk-marker",
    html: `<div class="other-marker-square"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const createUserLocationIcon = () =>
  new L.DivIcon({
    className: "user-location-marker",
    html: `<div class="user-location-dot"><span></span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

function FlyToLocation({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [position, map]);

  return null;
}

function MapView() {
  const [places, setPlaces] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [otherPlaces, setOtherPlaces] = useState([]);
  const [flyPosition, setFlyPosition] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const mapRef = useRef(null);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("All");
  const [mapMode, setMapMode] = useState("street");
  const [searchText, setSearchText] = useState("");

  const fetchMapData = async () => {
    try {
      const [placeRes, festivalRes, otherRes] = await Promise.all([
        getReligiousPlaces(),
        getFestivalPermissions(),
        getOtherPlaces(),
      ]);

      setPlaces(
        (placeRes.data.data || []).filter((p) => p.latitude && p.longitude)
      );
      setFestivals(
        (festivalRes.data.data || []).filter((f) => f.latitude && f.longitude)
      );
      setOtherPlaces(
        (otherRes.data.data || []).filter((o) => o.latitude && o.longitude)
      );
    } catch {
      toast.error("Failed to load GIS data");
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  useEffect(() => {
    const command = localStorage.getItem("mapCommand");

    if (command === "highRisk") {
      setRiskFilter("High");
      localStorage.removeItem("mapCommand");
      toast.success("High risk locations highlighted");
    } else if (command === "mediumRisk") {
      setRiskFilter("Medium");
      localStorage.removeItem("mapCommand");
      toast.success("Medium risk locations highlighted");
    } else if (command === "lowRisk") {
      setRiskFilter("Low");
      localStorage.removeItem("mapCommand");
      toast.success("Low risk locations highlighted");
    }
  }, []);

  const getAllMapRecords = () => {
    const religious = places.map((item) => ({
      ...item,
      recordType: "Religious Place",
      title: item.place_name,
      subtitle: `${item.place_type || "-"} • ${item.area || "-"}`,
    }));

    const festivalRecords = festivals.map((item) => ({
      ...item,
      recordType: "Festival Mandal",
      title: item.organizer_name || item.mandal_name || item.festival_name,
      subtitle: `${item.festival_name || "-"} • ${item.area || "-"}`,
    }));

    const others = otherPlaces.map((item) => ({
      ...item,
      recordType: "Other City Data",
      title: item.place_name,
      subtitle: `${item.category || "-"} • ${item.area || "-"}`,
    }));

    return [...religious, ...festivalRecords, ...others].filter(
      (item) => item.latitude && item.longitude
    );
  };

  useEffect(() => {
    const search = localStorage.getItem("mapSearch");
    if (!search) return;

    const timer = setTimeout(() => {
      const q = search.toLowerCase().trim();
      const allRecords = getAllMapRecords();

      const found = allRecords.find((item) => {
        const text = `
          ${item.title || ""}
          ${item.place_name || ""}
          ${item.organizer_name || ""}
          ${item.mandal_name || ""}
          ${item.festival_name || ""}
          ${item.category || ""}
          ${item.area || ""}
          ${item.address || ""}
          ${item.mobile || ""}
          ${item.contact_mobile || ""}
        `.toLowerCase();

        return text.includes(q);
      });

      if (found) {
        const lat = Number(found.latitude);
        const lng = Number(found.longitude);

        setSelectedRecord(found);
        setFlyPosition([lat, lng]);

        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 17, {
            animate: true,
            duration: 1.4,
          });
        }
        toast.success(`${found.title} found on map`);
      } else {
        setSearchText(search);
        toast.error("Exact record not found. Filtered search results.");
      }

      localStorage.removeItem("mapSearch");
    }, 800);

    return () => clearTimeout(timer);
  }, [places, festivals, otherPlaces]);

  const filteredPlaces = useMemo(() => {
    if (categoryFilter === "festival" || categoryFilter === "other") return [];

    return places.filter((p) => {
      const matchesRisk = riskFilter === "All" || p.risk_level === riskFilter;
      const matchesSearch =
        !searchText ||
        p.place_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.area?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.place_type?.toLowerCase().includes(searchText.toLowerCase());

      return matchesRisk && matchesSearch;
    });
  }, [places, categoryFilter, riskFilter, searchText]);

  const filteredFestivals = useMemo(() => {
    if (categoryFilter === "places" || categoryFilter === "other") return [];

    return festivals.filter((f) => {
      const matchesSearch =
        !searchText ||
        f.organizer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        f.festival_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        f.area?.toLowerCase().includes(searchText.toLowerCase());

      return matchesSearch;
    });
  }, [festivals, categoryFilter, searchText]);

  const filteredOtherPlaces = useMemo(() => {
    if (categoryFilter === "places" || categoryFilter === "festival") return [];

    return otherPlaces.filter((o) => {
      const matchesSearch =
        !searchText ||
        o.place_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        o.category?.toLowerCase().includes(searchText.toLowerCase()) ||
        o.area?.toLowerCase().includes(searchText.toLowerCase()) ||
        o.address?.toLowerCase().includes(searchText.toLowerCase()) ||
        o.mobile?.toLowerCase().includes(searchText.toLowerCase());

      return matchesSearch;
    });
  }, [otherPlaces, categoryFilter, searchText]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFlyPosition([
          position.coords.latitude,
          position.coords.longitude,
        ]);
        setUserLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
        toast.success("Current location found");
      },
      () => toast.error("Location permission denied")
    );
  };

  const tileUrl =
    mapMode === "satellite"
      ? "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const highRiskCount = places.filter((p) => p.risk_level === "High").length;
  const totalRecordsOnMap =
    filteredPlaces.length + filteredFestivals.length + filteredOtherPlaces.length;

  const selectRecordHandler = (item, typeName) => {
    const record = {
      ...item,
      recordType: typeName,
      title: item.place_name || item.organizer_name || item.festival_name || "Record",
      subtitle: `${item.place_type || item.festival_name || item.category || "-"} • ${item.area || "-"}`,
    };
    setSelectedRecord(record);
    if (item.latitude && item.longitude) {
      setFlyPosition([Number(item.latitude), Number(item.longitude)]);
    }
  };

  return (
    <div className="gis-command-page">
      {/* PAGE HEADER */}
      <div className="gis-page-header">
        <div className="header-title-block">
          <div className="live-status-badge">
            <Radio size={14} className="pulse-dot" />
            <span>LIVE MONITORING</span>
          </div>
          <h2>Live GIS Command Center</h2>
          <p>Malegaon City GIS Map & Real-time Location Monitoring</p>
        </div>

        <div className="header-kpis-strip">
          <div className="header-kpi-chip">
            <span className="kpi-label">Total Places</span>
            <b className="kpi-value">{places.length}</b>
          </div>
          <div className="header-kpi-chip red-kpi">
            <span className="kpi-label">High Risk</span>
            <b className="kpi-value">{highRiskCount}</b>
          </div>
          <div className="header-kpi-chip amber-kpi">
            <span className="kpi-label">Festivals</span>
            <b className="kpi-value">{festivals.length}</b>
          </div>
          <div className="header-kpi-chip blue-kpi">
            <span className="kpi-label">Other Places</span>
            <b className="kpi-value">{otherPlaces.length}</b>
          </div>

          <button
            type="button"
            className="primary-btn btn-sm"
            onClick={handleCurrentLocation}
          >
            <Navigation size={16} />
            My Location
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="gis-toolbar-card">
        <div className="gis-search-input-box">
          <Search size={18} className="search-icon-teal" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search place, festival, area or ward..."
          />
        </div>

        <div className="gis-filter-pills-row">
          <span className="filter-group-label">Category:</span>
          <div className="pills-scroll-container">
            <button
              type="button"
              className={`filter-pill ${categoryFilter === "all" ? "active" : ""}`}
              onClick={() => setCategoryFilter("all")}
            >
              ALL ({places.length + festivals.length + otherPlaces.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${categoryFilter === "places" ? "active" : ""}`}
              onClick={() => setCategoryFilter("places")}
            >
              🛕 RELIGIOUS ({places.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${categoryFilter === "festival" ? "active" : ""}`}
              onClick={() => setCategoryFilter("festival")}
            >
              🎉 FESTIVAL MANDALS ({festivals.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${categoryFilter === "other" ? "active" : ""}`}
              onClick={() => setCategoryFilter("other")}
            >
              🏪 OTHER PLACES ({otherPlaces.length})
            </button>
          </div>

          <div className="filter-divider-v"></div>

          <span className="filter-group-label">Risk:</span>
          <div className="pills-scroll-container">
            <button
              type="button"
              className={`filter-pill risk-pill ${riskFilter === "All" ? "active" : ""}`}
              onClick={() => setRiskFilter("All")}
            >
              ALL RISK
            </button>
            <button
              type="button"
              className={`filter-pill risk-pill green ${riskFilter === "Low" ? "active" : ""}`}
              onClick={() => setRiskFilter("Low")}
            >
              🟢 LOW
            </button>
            <button
              type="button"
              className={`filter-pill risk-pill amber ${riskFilter === "Medium" ? "active" : ""}`}
              onClick={() => setRiskFilter("Medium")}
            >
              🟠 MEDIUM
            </button>
            <button
              type="button"
              className={`filter-pill risk-pill red ${riskFilter === "High" ? "active" : ""}`}
              onClick={() => setRiskFilter("High")}
            >
              🔴 HIGH ({highRiskCount})
            </button>
          </div>
        </div>
      </div>

      {/* MAIN THREE-COLUMN GIS LAYOUT */}
      <div className="gis-main-shell">
        {/* LEFT PANEL: CONTROLS & LEGEND */}
        <aside className="gis-left-panel">
          <div className="panel-box">
            <div className="panel-box-header">
              <Layers size={18} />
              <h4>Map Settings</h4>
            </div>

            <div className="control-group">
              <label>Tile Layer Mode</label>
              <select
                className="gis-select-input"
                value={mapMode}
                onChange={(e) => setMapMode(e.target.value)}
              >
                <option value="street">Street Map (OpenStreetMap)</option>
                <option value="satellite">Terrain / Satellite Map</option>
              </select>
            </div>
          </div>

          <div className="panel-box">
            <div className="panel-box-header">
              <Info size={18} />
              <h4>Map Markers Legend</h4>
            </div>

            <div className="gis-legend-list">
              <div className="legend-item">
                <i className="legend-circle"></i>
                <span>Permanent Religious Place</span>
              </div>
              <div className="legend-item">
                <i className="legend-diamond"></i>
                <span>Festival Mandal</span>
              </div>
              <div className="legend-item">
                <i className="legend-square"></i>
                <span>Other City Place</span>
              </div>

              <div className="legend-divider"></div>

              <div className="legend-item">
                <span className="dot-badge green"></span>
                <span>Low Risk Location</span>
              </div>
              <div className="legend-item">
                <span className="dot-badge amber"></span>
                <span>Medium Risk Location</span>
              </div>
              <div className="legend-item">
                <span className="dot-badge red"></span>
                <span>High Risk Location</span>
              </div>
            </div>
          </div>

          <div className="panel-box risk-alert-panel">
            <ShieldAlert size={22} className="alert-icon-red" />
            <div>
              <h4>High Risk Alert</h4>
              <p><b>{highRiskCount}</b> locations require high police monitoring</p>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: INTERACTIVE LEAFLET MAP */}
        <main className="gis-map-card">
          <div className="map-card-header">
            <div className="map-title">
              <MapPin size={18} />
              <h3>Interactive GIS Map</h3>
              <span className="map-records-badge">{totalRecordsOnMap} Places Visible</span>
            </div>

            <div className="map-view-controls">
              <button
                type="button"
                className="btn-map-control"
                onClick={() => setFlyPosition([20.5579, 74.5287])}
              >
                Reset View
              </button>
            </div>
          </div>

          <div className="gis-map-wrapper">
            <MapContainer
              center={[20.5579, 74.5287]}
              zoom={13}
              dragging={true}
              touchZoom={true}
              scrollWheelZoom={true}
              doubleClickZoom={true}
              zoomControl={true}
              className="gis-leaflet-container"
              ref={mapRef}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url={tileUrl}
              />

              <FlyToLocation position={flyPosition} />

              {userLocation && (
                <Marker position={userLocation} icon={createUserLocationIcon()}>
                  <Popup>
                    <div className="map-popup">
                      <b>Your Live Location</b>
                    </div>
                  </Popup>
                </Marker>
              )}

              {filteredPlaces.map((place) => (
                <Marker
                  key={`place-${place.id}`}
                  position={[Number(place.latitude), Number(place.longitude)]}
                  icon={createPlaceIcon(riskColor[place.risk_level] || riskColor.Low)}
                  eventHandlers={{
                    click: () => selectRecordHandler(place, "Religious Place"),
                  }}
                >
                  <Popup>
                    <div className="map-popup dashboard-marker-popup">
                      <h3>{place.place_name}</h3>
                      <p><b>Type:</b> {place.place_type || "Religious Place"}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {filteredFestivals.map((festival) => (
                <Marker
                  key={`festival-${festival.id}`}
                  position={[Number(festival.latitude), Number(festival.longitude)]}
                  icon={createFestivalIcon()}
                  eventHandlers={{
                    click: () => selectRecordHandler(festival, "Festival Mandal"),
                  }}
                >
                  <Popup>
                    <div className="map-popup dashboard-marker-popup">
                      <h3>{festival.organizer_name || festival.festival_name}</h3>
                      <p><b>Festival:</b> {festival.festival_name || "-"}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {filteredOtherPlaces.map((item) => (
                <Marker
                  key={`other-${item.id}`}
                  position={[Number(item.latitude), Number(item.longitude)]}
                  icon={createOtherIcon()}
                  eventHandlers={{
                    click: () => selectRecordHandler(item, "Other City Data"),
                  }}
                >
                  <Popup>
                    <div className="map-popup dashboard-marker-popup">
                      <h3>{item.place_name}</h3>
                      <p><b>Category:</b> {item.category || "Other"}</p>
                      <p><b>Area:</b> {item.area || "-"}</p>
                      <button
                        type="button"
                        className="popup-details-btn"
                        onClick={() => selectRecordHandler(item, "Other City Data")}
                      >
                        View Full Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </main>

        {/* RIGHT PANEL: SELECTED DETAILS & RECORD LIST */}
        <aside className="gis-right-panel">
          {selectedRecord ? (
            <div className="panel-box selected-record-box">
              <div className="selected-header">
                <span className="selected-badge">{selectedRecord.recordType}</span>
                <h3>{selectedRecord.title}</h3>
                <p>{selectedRecord.subtitle}</p>
              </div>

              <div className="selected-quick-details">
                <div>
                  <span className="quick-label">Area</span>
                  <b>{selectedRecord.area || "-"}</b>
                </div>
                <div>
                  <span className="quick-label">Police Station</span>
                  <b>{selectedRecord.police_station || "-"}</b>
                </div>
                <div>
                  <span className="quick-label">Risk / Status</span>
                  <b>
                    {selectedRecord.risk_level ||
                      selectedRecord.permission_status ||
                      "-"}
                  </b>
                </div>
              </div>

              <div className="selected-actions-row">
                <button
                  type="button"
                  className="primary-btn btn-sm"
                  onClick={() => setSelectedRecord(selectedRecord)}
                >
                  <ExternalLink size={15} />
                  Full View Details
                </button>
              </div>
            </div>
          ) : (
            <div className="panel-box empty-selected-box">
              <Info size={24} className="icon-muted" />
              <p>Click any map marker or record below to view details</p>
            </div>
          )}

          <div className="panel-box">
            <div className="panel-box-header">
              <Church size={18} />
              <h4>Monitored Places ({totalRecordsOnMap})</h4>
            </div>

            <div className="gis-sidebar-records-scroll">
              {filteredPlaces.map((place) => (
                <div
                  className="gis-sidebar-record-card"
                  key={`side-place-${place.id}`}
                  onClick={() => selectRecordHandler(place, "Religious Place")}
                >
                  <Church size={16} className="card-icon teal" />
                  <div className="card-info">
                    <b>{place.place_name}</b>
                    <p>{place.place_type || "Religious"} • {place.area || "-"}</p>
                  </div>
                  <span className={`risk-tag-dot ${place.risk_level?.toLowerCase() || "low"}`}>
                    {place.risk_level || "Low"}
                  </span>
                </div>
              ))}

              {filteredFestivals.map((festival) => (
                <div
                  className="gis-sidebar-record-card festival"
                  key={`side-festival-${festival.id}`}
                  onClick={() => selectRecordHandler(festival, "Festival Mandal")}
                >
                  <CalendarCheck size={16} className="card-icon amber" />
                  <div className="card-info">
                    <b>{festival.organizer_name || festival.festival_name}</b>
                    <p>{festival.festival_name} • {festival.area || "-"}</p>
                  </div>
                  <span className="status-tag-amber">
                    {festival.permission_status || "Pending"}
                  </span>
                </div>
              ))}

              {filteredOtherPlaces.map((item) => (
                <div
                  className="gis-sidebar-record-card other"
                  key={`side-other-${item.id}`}
                  onClick={() => selectRecordHandler(item, "Other City Data")}
                >
                  <Store size={16} className="card-icon blue" />
                  <div className="card-info">
                    <b>{item.place_name}</b>
                    <p>{item.category || "Other"} • {item.area || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* UNIVERSAL RECORD DETAILS MODAL */}
      <RecordDetailsModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}

export default MapView;