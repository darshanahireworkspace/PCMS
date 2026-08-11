import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import {
  MapPin,
  Search,
  Navigation,
  ExternalLink,
  X,
  Layers,
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
  const [modalRecord, setModalRecord] = useState(null);
  const mapRef = useRef(null);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [mapMode, setMapMode] = useState("street");

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

  const matchSearch = (item) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase().trim();
    const title = (
      item.place_name ||
      item.organizer_name ||
      item.festival_name ||
      item.mandal_name ||
      ""
    ).toLowerCase();
    const subtitle = (
      item.place_type ||
      item.category ||
      item.area ||
      item.address ||
      ""
    ).toLowerCase();
    const contact = (
      item.contact_person ||
      item.president_name ||
      item.owner_name ||
      ""
    ).toLowerCase();
    const phone = String(
      item.contact_mobile || item.president_mobile || item.mobile || ""
    );

    return (
      title.includes(q) ||
      subtitle.includes(q) ||
      contact.includes(q) ||
      phone.includes(q)
    );
  };

  const filteredPlaces = useMemo(() => {
    if (categoryFilter === "festival" || categoryFilter === "other") return [];
    return places.filter(matchSearch);
  }, [places, categoryFilter, searchText]);

  const filteredFestivals = useMemo(() => {
    if (categoryFilter === "places" || categoryFilter === "other") return [];
    return festivals.filter(matchSearch);
  }, [festivals, categoryFilter, searchText]);

  const filteredOtherPlaces = useMemo(() => {
    if (categoryFilter === "places" || categoryFilter === "festival") return [];
    return otherPlaces.filter(matchSearch);
  }, [otherPlaces, categoryFilter, searchText]);

  const totalRecordsOnMap =
    filteredPlaces.length +
    filteredFestivals.length +
    filteredOtherPlaces.length;

  const selectRecordHandler = (item, typeName) => {
    const record = {
      ...item,
      recordType: typeName,
      title:
        item.place_name ||
        item.organizer_name ||
        item.festival_name ||
        "Record",
      subtitle: `${
        item.place_type || item.festival_name || item.category || "-"
      } • ${item.area || "-"}`,
    };
    setSelectedRecord(record);
    if (item.latitude && item.longitude) {
      setFlyPosition([Number(item.latitude), Number(item.longitude)]);
    }
  };

  const tileUrl =
    mapMode === "satellite"
      ? "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className="gis-redesign-container">
      {/* 1. PAGE HEADER */}
      <div className="gis-header-block">
        <div className="gis-header-left">
          <div className="gis-header-icon-box">
            <MapPin size={22} />
          </div>
          <div>
            <h2 className="gis-page-title">GIS Map</h2>
            <p className="gis-page-subtitle">
              View and locate registered city records
            </p>
          </div>
        </div>

        <div className="gis-header-actions">
          <button
            type="button"
            className="secondary-btn btn-sm"
            onClick={() =>
              setMapMode((prev) => (prev === "street" ? "satellite" : "street"))
            }
          >
            <Layers size={15} />
            {mapMode === "street" ? "Satellite View" : "Street View"}
          </button>

          <button
            type="button"
            className="primary-btn btn-sm"
            onClick={handleCurrentLocation}
          >
            <Navigation size={15} />
            My Location
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="gis-search-card">
        <div className="gis-search-inner">
          <Search size={19} className="gis-search-icon" />
          <input
            type="text"
            className="gis-search-input"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search places, stations, officers..."
            aria-label="Search places, stations, officers"
          />
          {searchText && (
            <button
              type="button"
              className="gis-clear-search"
              onClick={() => setSearchText("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 3. SIMPLIFIED CATEGORY FILTER ROW */}
      <div className="gis-filter-bar">
        <button
          type="button"
          className={`gis-filter-btn ${
            categoryFilter === "all" ? "active" : ""
          }`}
          onClick={() => setCategoryFilter("all")}
        >
          All Records ({places.length + festivals.length + otherPlaces.length})
        </button>

        <button
          type="button"
          className={`gis-filter-btn ${
            categoryFilter === "places" ? "active" : ""
          }`}
          onClick={() => setCategoryFilter("places")}
        >
          🛕 Religious ({places.length})
        </button>

        <button
          type="button"
          className={`gis-filter-btn ${
            categoryFilter === "festival" ? "active" : ""
          }`}
          onClick={() => setCategoryFilter("festival")}
        >
          🎉 Festivals ({festivals.length})
        </button>

        <button
          type="button"
          className={`gis-filter-btn ${
            categoryFilter === "other" ? "active" : ""
          }`}
          onClick={() => setCategoryFilter("other")}
        >
          🏢 Other ({otherPlaces.length})
        </button>
      </div>

      {/* 4. MAIN MAP CARD CONTAINER */}
      <div className="gis-map-viewport-card">
        <div className="gis-map-inner-box">
          <MapContainer
            center={[20.5579, 74.5287]}
            zoom={13}
            dragging={true}
            touchZoom={true}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            zoomControl={true}
            className="gis-leaflet-canvas"
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
                icon={createPlaceIcon(
                  riskColor[place.risk_level] || riskColor.Low
                )}
                eventHandlers={{
                  click: () => selectRecordHandler(place, "Religious Place"),
                }}
              >
                <Popup>
                  <div className="map-popup dashboard-marker-popup">
                    <h3>{place.place_name}</h3>
                    <p>
                      <b>Type:</b> {place.place_type || "Religious Place"}
                    </p>
                    <p>
                      <b>Area:</b> {place.area || "-"}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {filteredFestivals.map((festival) => (
              <Marker
                key={`festival-${festival.id}`}
                position={[
                  Number(festival.latitude),
                  Number(festival.longitude),
                ]}
                icon={createFestivalIcon()}
                eventHandlers={{
                  click: () => selectRecordHandler(festival, "Festival Mandal"),
                }}
              >
                <Popup>
                  <div className="map-popup dashboard-marker-popup">
                    <h3>
                      {festival.organizer_name || festival.festival_name}
                    </h3>
                    <p>
                      <b>Festival:</b> {festival.festival_name || "-"}
                    </p>
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
                    <p>
                      <b>Category:</b> {item.category || "Other"}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* COMPACT MAP LEGEND OVERLAY */}
          <div className="gis-map-overlay-legend">
            <span>
              <i className="legend-dot teal"></i> Religious
            </span>
            <span>
              <i className="legend-dot purple"></i> Festival
            </span>
            <span>
              <i className="legend-dot blue"></i> Other
            </span>
          </div>

          {/* NO RESULTS BADGE */}
          {totalRecordsOnMap === 0 && (
            <div className="gis-map-empty-overlay">
              <p>No locations found matching search filter.</p>
            </div>
          )}
        </div>

        {/* SELECTED RECORD BOTTOM DETAILS PANEL */}
        {selectedRecord && (
          <div className="gis-selected-detail-card">
            <div className="selected-detail-header">
              <div>
                <span className="selected-detail-type">
                  {selectedRecord.recordType}
                </span>
                <h4 className="selected-detail-title">
                  {selectedRecord.title}
                </h4>
                <p className="selected-detail-subtitle">
                  {selectedRecord.subtitle}
                </p>
              </div>

              <button
                type="button"
                className="selected-detail-close"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="selected-detail-meta">
              <span>📍 {selectedRecord.area || selectedRecord.address || "-"}</span>
              <span>
                🛡️ {selectedRecord.risk_level || selectedRecord.permission_status || selectedRecord.category || "Monitored"}
              </span>
            </div>

            <div className="selected-detail-actions">
              <button
                type="button"
                className="primary-btn btn-sm"
                onClick={() => setModalRecord(selectedRecord)}
              >
                <ExternalLink size={14} />
                View Full Details
              </button>

              {selectedRecord.latitude && selectedRecord.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${selectedRecord.latitude},${selectedRecord.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="secondary-btn btn-sm"
                >
                  📍 Open Maps
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. COMPACT MAP SUMMARY STRIP */}
      <div className="gis-summary-strip">
        <div className="gis-summary-card">
          <span className="summary-icon blue">📍</span>
          <div>
            <b>{totalRecordsOnMap}</b>
            <span>Total Visible</span>
          </div>
        </div>

        <div className="gis-summary-card">
          <span className="summary-icon teal">🛕</span>
          <div>
            <b>{filteredPlaces.length}</b>
            <span>Religious</span>
          </div>
        </div>

        <div className="gis-summary-card">
          <span className="summary-icon purple">🎉</span>
          <div>
            <b>{filteredFestivals.length}</b>
            <span>Festivals</span>
          </div>
        </div>

        <div className="gis-summary-card">
          <span className="summary-icon emerald">🏢</span>
          <div>
            <b>{filteredOtherPlaces.length}</b>
            <span>Other</span>
          </div>
        </div>
      </div>

      {/* UNIVERSAL RECORD DETAILS MODAL */}
      <RecordDetailsModal
        record={modalRecord}
        onClose={() => setModalRecord(null)}
      />
    </div>
  );
}

export default MapView;