import { useEffect, useState } from "react";
import {
  Landmark,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  CalendarCheck,
  RefreshCcw,
  Search,
  X,
  ExternalLink,
  Store,
  Database,
  Radio,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import toast from "react-hot-toast";

import { getDashboardStats } from "../api/dashboardApi";
import { getPoliceStations } from "../api/policeStationApi";
import { getOtherPlaces } from "../api/otherPlaceApi";
import useAuth from "../hooks/useAuth";
import VoiceField from "../components/common/VoiceField";
import RecordDetailsModal from "../components/common/RecordDetailsModal";

const riskColor = {
  Low: "#16a34a",
  Medium: "#f59e0b",
  High: "#dc2626",
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

function Dashboard() {
  const { officer } = useAuth();

  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState("places");
  const [mapFilter, setMapFilter] = useState("all");
  const [policeStations, setPoliceStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const [stats, setStats] = useState({});
  const [religiousPlaces, setReligiousPlaces] = useState([]);
  const [festivalPermissions, setFestivalPermissions] = useState([]);
  const [otherPlaces, setOtherPlaces] = useState([]);

  const fetchDashboard = async (station = selectedStation) => {
    try {
      setLoading(true);
      const res = await getDashboardStats(station);
      setStats(res.data.stats || {});
      setReligiousPlaces(res.data.religiousPlaces || []);
      setFestivalPermissions(res.data.festivalPermissions || []);

      const otherRes = await getOtherPlaces();
      setOtherPlaces(otherRes.data.data || []);
    } catch (error) {
      console.error("Dashboard load error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadStations = async () => {
      try {
        const res = await getPoliceStations();
        setPoliceStations(res.data.data || []);
      } catch (error) {
        console.error("Police station load error:", error);
        toast.error("Failed to load police stations");
      }
    };

    loadStations();
    fetchDashboard("");
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  const totalRecordCount =
    (stats.totalPlaces || 0) +
    (stats.festivalPermissions || 0) +
    otherPlaces.length;

  const primaryCards = [
    {
      key: "places",
      title: "Religious Places",
      value: stats.totalPlaces || 0,
      subtitle: "Registered locations",
      icon: <Landmark size={22} />,
      accentClass: "teal-accent",
    },
    {
      key: "festivals",
      title: "Festival Permissions",
      value: stats.festivalPermissions || 0,
      subtitle: "Approved mandals",
      icon: <CalendarCheck size={22} />,
      accentClass: "amber-accent",
    },
    {
      key: "other",
      title: "Other Places",
      value: otherPlaces.length,
      subtitle: "Civic & commercial",
      icon: <Store size={22} />,
      accentClass: "emerald-accent",
    },
    {
      key: "total",
      title: "Total Records",
      value: totalRecordCount,
      subtitle: "Monitored entities",
      icon: <Database size={22} />,
      accentClass: "blue-accent",
    },
  ];

  const searchResults = [
    ...religiousPlaces.map((item) => ({
      ...item,
      recordType: "Religious Place",
      title: item.place_name,
      subtitle: `${item.place_type || "-"} • ${item.area || "-"}`,
    })),
    ...festivalPermissions.map((item) => ({
      ...item,
      recordType: "Festival Mandal",
      title:
        item.organizer_name ||
        item.president_name ||
        item.festival_name ||
        "Festival Permission",
      subtitle: `${item.festival_name || "-"} • ${item.area || "-"}`,
    })),
    ...otherPlaces.map((item) => ({
      ...item,
      recordType: "Other City Data",
      title: item.place_name,
      subtitle: `${item.category || "-"} • ${item.area || "-"}`,
    })),
  ].filter((item) => {
    const query = dashboardSearch.toLowerCase().trim();
    if (!query) return true;

    return (
      item.title?.toLowerCase().includes(query) ||
      item.subtitle?.toLowerCase().includes(query) ||
      item.contact_person?.toLowerCase().includes(query) ||
      item.president_name?.toLowerCase().includes(query) ||
      item.organizer_name?.toLowerCase().includes(query) ||
      item.owner_name?.toLowerCase().includes(query) ||
      String(item.contact_mobile || "").includes(query) ||
      String(item.president_mobile || "").includes(query) ||
      String(item.mobile || "").includes(query)
    );
  });

  const filteredPlaces = religiousPlaces.filter((place) => {
    if (selectedModule === "highRisk") {
      return place.risk_level === "High";
    }
    return true;
  });

  const openReligiousRecord = (place) => {
    setSelectedRecord({
      ...place,
      recordType: "Religious Place",
      title: place.place_name,
      subtitle: `${place.place_type || "-"} • ${place.area || "-"}`,
    });
  };

  const openFestivalRecord = (festival) => {
    setSelectedRecord({
      ...festival,
      recordType: "Festival Mandal",
      title:
        festival.organizer_name ||
        festival.president_name ||
        festival.festival_name ||
        "Festival Permission",
      subtitle: `${festival.festival_name || "-"} • ${
        festival.area || "-"
      }`,
    });
  };

  const openOtherRecord = (item) => {
    setSelectedRecord({
      ...item,
      recordType: "Other City Data",
      title: item.place_name,
      subtitle: `${item.category || "-"} • ${item.area || "-"}`,
    });
  };

  const selectedContactName =
    selectedRecord?.contact_person ||
    selectedRecord?.president_name ||
    selectedRecord?.organizer_name ||
    selectedRecord?.owner_name ||
    "-";

  const selectedMobile =
    selectedRecord?.contact_mobile ||
    selectedRecord?.president_mobile ||
    selectedRecord?.organizer_mobile ||
    selectedRecord?.mobile ||
    "";

  const selectedMapLink =
    selectedRecord?.google_map_link ||
    (selectedRecord?.latitude && selectedRecord?.longitude
      ? `https://www.google.com/maps?q=${selectedRecord.latitude},${selectedRecord.longitude}`
      : "");

  return (
    <div className="dashboard-container">
      {/* HERO SECTION */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <span className="hero-kicker">
            MAHARASHTRA POLICE • CHHAVANI POLICE STATION
          </span>
          <h1 className="hero-title">Police City Command Center</h1>
          <p className="hero-subtitle">
            Live monitoring and management of city infrastructure, religious places and festival permissions.
          </p>
        </div>

        <div className="hero-status-card">
          <div className="hero-status-pill">
            <Radio size={14} className="pulse-dot" />
            <span>LIVE MONITORING</span>
          </div>
          <b className="hero-city-name">Malegaon City</b>
          <span className="hero-station-name">
            {selectedStation || officer?.police_station || "Chhavani PS"}
          </span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="dashboard-search-card">
        <div className="dashboard-live-search">
          <Search size={20} className="search-icon-teal" />
          <VoiceField
            name="dashboardSearch"
            value={dashboardSearch}
            onChange={(e) => setDashboardSearch(e.target.value)}
            placeholder="Search places, festivals, officers or city records..."
          />
        </div>

        {dashboardSearch && (
          <div className="dashboard-search-results">
            {searchResults.length === 0 ? (
              <p className="no-search-results">No matching records found.</p>
            ) : (
              searchResults.map((item) => (
                <button
                  type="button"
                  key={`${item.recordType}-${item.id}`}
                  className="search-result-row"
                  onClick={() => {
                    setSelectedRecord(item);
                    setDashboardSearch("");
                  }}
                >
                  <b>{item.title}</b>
                  <span>
                    {item.recordType} • {item.subtitle}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* PRIMARY METRICS */}
      <div className="dashboard-primary-metrics">
        {primaryCards.map((card) => (
          <div
            className={`metric-card ${card.accentClass} ${
              selectedModule === card.key ? "active-metric-card" : ""
            }`}
            key={card.key}
            onClick={() => setSelectedModule(card.key)}
            role="button"
            tabIndex={0}
          >
            <div className="metric-card-top">
              <div className="metric-icon-box">{card.icon}</div>
              <span className="metric-title">{card.title}</span>
            </div>

            <div className="metric-card-middle">
              <h2 className="metric-value">
                {loading ? "..." : card.value}
              </h2>
            </div>

            <div className="metric-card-bottom">
              <span className="metric-subtitle">{card.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* RISK MONITORING SECTION */}
      <section className="dashboard-risk-section">
        <div className="section-header-strip">
          <div>
            <h3 className="section-title-text">Risk Monitoring</h3>
            <p className="section-subtitle-text">
              Current distribution of monitored locations
            </p>
          </div>

          <div className="filter-station-box">
            <select
              className="station-filter-select"
              value={selectedStation}
              onChange={(e) => {
                setSelectedStation(e.target.value);
                fetchDashboard(e.target.value);
              }}
            >
              <option value="">All Police Stations</option>
              {policeStations.map((station) => (
                <option key={station.id} value={station.station_name}>
                  {station.station_name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="secondary-btn btn-sm"
              onClick={() => fetchDashboard()}
              disabled={loading}
            >
              <RefreshCcw size={15} />
              {loading ? "..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="risk-cards-grid">
          <div className="risk-card high-risk-card">
            <div className="risk-card-header">
              <div className="risk-card-icon red">
                <ShieldAlert size={20} />
              </div>
              <span className="risk-tag red">HIGH RISK</span>
            </div>

            <div className="risk-card-body">
              <h2>{loading ? "..." : stats.highRisk || 0}</h2>
              <p>Locations requiring attention</p>
            </div>

            <div className="risk-progress-bar red">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    ((stats.highRisk || 0) /
                      Math.max(1, stats.totalPlaces || 1)) *
                      100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="risk-card medium-risk-card">
            <div className="risk-card-header">
              <div className="risk-card-icon amber">
                <AlertCircle size={20} />
              </div>
              <span className="risk-tag amber">MEDIUM RISK</span>
            </div>

            <div className="risk-card-body">
              <h2>{loading ? "..." : stats.mediumRisk || 0}</h2>
              <p>Moderate supervision required</p>
            </div>

            <div className="risk-progress-bar amber">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    ((stats.mediumRisk || 0) /
                      Math.max(1, stats.totalPlaces || 1)) *
                      100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="risk-card low-risk-card">
            <div className="risk-card-header">
              <div className="risk-card-icon green">
                <ShieldCheck size={20} />
              </div>
              <span className="risk-tag green">LOW RISK</span>
            </div>

            <div className="risk-card-body">
              <h2>{loading ? "..." : stats.lowRisk || 0}</h2>
              <p>Standard routine monitoring</p>
            </div>

            <div className="risk-progress-bar green">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    ((stats.lowRisk || 0) /
                      Math.max(1, stats.totalPlaces || 1)) *
                      100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT: MAP + RECENT ACTIVITY / RECORDS */}
      <div className="dashboard-main-grid">
        {/* LEFT COLUMN: LIVE CITY MAP */}
        <div className="dashboard-map-card">
          <div className="dashboard-map-header">
            <div>
              <div className="map-title-row">
                <h3>Live City Map</h3>
                <span className="map-live-pill">● Live</span>
              </div>
              <p>Registered religious places, festival mandals and other city data</p>
            </div>

            <div className="dashboard-map-stats">
              <span>
                Religious: <b>{stats.totalPlaces || 0}</b>
              </span>
              <span>
                Mandals: <b>{stats.festivalPermissions || 0}</b>
              </span>
              <span>
                Other: <b>{otherPlaces.length}</b>
              </span>
            </div>
          </div>

          <div className="dashboard-map-filters">
            <button
              type="button"
              className={mapFilter === "all" ? "active" : ""}
              onClick={() => setMapFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={mapFilter === "places" ? "active" : ""}
              onClick={() => setMapFilter("places")}
            >
              🛕 Religious
            </button>
            <button
              type="button"
              className={mapFilter === "festival" ? "active" : ""}
              onClick={() => setMapFilter("festival")}
            >
              🎉 Mandals
            </button>
            <button
              type="button"
              className={mapFilter === "other" ? "active" : ""}
              onClick={() => setMapFilter("other")}
            >
              🏪 Other
            </button>
            <button
              type="button"
              className={mapFilter === "high" ? "active" : ""}
              onClick={() => setMapFilter("high")}
            >
              🔴 High
            </button>
            <button
              type="button"
              className={mapFilter === "medium" ? "active" : ""}
              onClick={() => setMapFilter("medium")}
            >
              🟠 Medium
            </button>
            <button
              type="button"
              className={mapFilter === "low" ? "active" : ""}
              onClick={() => setMapFilter("low")}
            >
              🟢 Low
            </button>
          </div>

          <div className="dashboard-map-box">
            <MapContainer
              center={[20.5579, 74.5287]}
              zoom={12}
              dragging={true}
              touchZoom={true}
              scrollWheelZoom={true}
              doubleClickZoom={true}
              zoomControl={true}
              className="dashboard-mini-map"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {userLocation && (
                <Marker position={userLocation} icon={createUserLocationIcon()}>
                  <Popup>
                    <b>Your Live Location</b>
                  </Popup>
                </Marker>
              )}

              {mapFilter !== "festival" &&
                mapFilter !== "other" &&
                religiousPlaces
                  .filter((place) => place.latitude && place.longitude && Number(place.latitude) !== 0)
                  .filter((place) => {
                    if (mapFilter === "places") return true;
                    if (mapFilter === "high") return place.risk_level === "High";
                    if (mapFilter === "medium") return place.risk_level === "Medium";
                    if (mapFilter === "low") return place.risk_level === "Low";
                    return true;
                  })
                  .map((place) => (
                    <Marker
                      key={`dash-place-${place.id}`}
                      position={[Number(place.latitude), Number(place.longitude)]}
                      icon={createPlaceIcon(riskColor[place.risk_level] || riskColor.Low)}
                      eventHandlers={{
                        click: () => openReligiousRecord(place),
                      }}
                    >
                      <Popup>
                        <div className="map-popup dashboard-marker-popup">
                          <h3>{place.place_name}</h3>
                          <p>
                            <b>Type:</b> {place.place_type || "-"}
                          </p>
                          <p>
                            <b>Area:</b> {place.area || "-"}
                          </p>
                          <p>
                            <b>Risk:</b> {place.risk_level || "Low"}
                          </p>
                          <button
                            type="button"
                            className="popup-details-btn"
                            onClick={() => openReligiousRecord(place)}
                          >
                            View Full Details
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

              {(mapFilter === "all" || mapFilter === "festival") &&
                festivalPermissions
                  .filter((f) => f.latitude && f.longitude && Number(f.latitude) !== 0)
                  .map((festival) => (
                    <Marker
                      key={`dash-festival-${festival.id}`}
                      position={[Number(festival.latitude), Number(festival.longitude)]}
                      icon={createFestivalIcon()}
                      eventHandlers={{
                        click: () => openFestivalRecord(festival),
                      }}
                    >
                      <Popup>
                        <div className="map-popup dashboard-marker-popup">
                          <h3>
                            {festival.organizer_name ||
                              festival.festival_name ||
                              "Festival Mandal"}
                          </h3>
                          <p>
                            <b>Festival:</b> {festival.festival_name || "-"}
                          </p>
                          <p>
                            <b>Area:</b> {festival.area || "-"}
                          </p>
                          <p>
                            <b>Permission:</b>{" "}
                            {festival.permission_status || "Pending"}
                          </p>
                          <button
                            type="button"
                            className="popup-details-btn"
                            onClick={() => openFestivalRecord(festival)}
                          >
                            View Full Details
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

              {(mapFilter === "all" || mapFilter === "other") &&
                otherPlaces
                  .filter((item) => item.latitude && item.longitude && Number(item.latitude) !== 0)
                  .map((item) => (
                    <Marker
                      key={`other-map-${item.id}`}
                      position={[Number(item.latitude), Number(item.longitude)]}
                      icon={createOtherIcon()}
                      eventHandlers={{
                        click: () => openOtherRecord(item),
                      }}
                    >
                      <Popup>
                        <div className="map-popup dashboard-marker-popup">
                          <h3>{item.place_name}</h3>
                          <p>
                            <b>Type:</b> Other City Data
                          </p>
                          <p>
                            <b>Category:</b> {item.category || "-"}
                          </p>
                          <p>
                            <b>Area:</b> {item.area || "-"}
                          </p>
                          <p>
                            <b>Mobile:</b> {item.mobile || "-"}
                          </p>
                          <button
                            type="button"
                            className="popup-details-btn"
                            onClick={() => openOtherRecord(item)}
                          >
                            View Full Details
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
            </MapContainer>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT ACTIVITY & MONITORING PANEL */}
        <div className="dashboard-right-panel">
          <div className="panel-card activity-panel">
            <h3>Recent Activity</h3>

            <div className="activity-item">
              <span className="activity-dot blue"></span>
              <div>
                <b>Religious Place Registered</b>
                <p>
                  {religiousPlaces[0]?.place_name || "No recent place record"}
                </p>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-dot purple"></span>
              <div>
                <b>Festival Permission Added</b>
                <p>
                  {festivalPermissions[0]?.organizer_name ||
                    festivalPermissions[0]?.festival_name ||
                    "No recent festival record"}
                </p>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-dot green"></span>
              <div>
                <b>Other City Place Added</b>
                <p>
                  {otherPlaces[0]?.place_name || "No recent other place record"}
                </p>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-dot red"></span>
              <div>
                <b>High Risk Locations</b>
                <p>{stats.highRisk || 0} locations marked high risk</p>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-dot green"></span>
              <div>
                <b>System Status</b>
                <p>Database connected and live monitoring active</p>
              </div>
            </div>
          </div>

          <div className="panel-card dashboard-details-panel">
            <h3>
              {selectedModule === "festivals"
                ? "Festival Permission Records"
                : selectedModule === "other"
                ? "Other City Data Records"
                : "Religious Place Records"}
            </h3>

            {selectedModule === "festivals" ? (
              festivalPermissions.length === 0 ? (
                <p className="no-records-text">No festival permissions found.</p>
              ) : (
                festivalPermissions.map((item) => (
                  <div
                    className="event-row clickable-record"
                    key={item.id}
                    onClick={() => openFestivalRecord(item)}
                  >
                    <span>
                      <b>
                        {item.organizer_name || item.festival_name || "-"}
                      </b>
                      <br />
                      <small>
                        {item.festival_name || "-"} •{" "}
                        {item.permission_status || "Pending"} •{" "}
                        {item.area || "-"}
                      </small>
                    </span>
                    <span
                      className={`permission-status ${(
                        item.permission_status || "pending"
                      ).toLowerCase()}`}
                    >
                      {item.permission_status || "Pending"}
                    </span>
                  </div>
                ))
              )
            ) : selectedModule === "other" ? (
              otherPlaces.length === 0 ? (
                <p className="no-records-text">No other city records found.</p>
              ) : (
                otherPlaces.map((item) => (
                  <div
                    className="event-row clickable-record"
                    key={`other-${item.id}`}
                    onClick={() => openOtherRecord(item)}
                  >
                    <span>
                      <b>{item.place_name}</b>
                      <br />
                      <small>
                        {item.category || "-"} • {item.area || "-"}
                      </small>
                    </span>
                    <span className="dashboard-other-category">
                      {item.category || "Other"}
                    </span>
                  </div>
                ))
              )
            ) : filteredPlaces.length === 0 ? (
              <p className="no-records-text">No religious places found.</p>
            ) : (
              filteredPlaces.map((place) => (
                <div
                  className="event-row clickable-record"
                  key={place.id}
                  onClick={() => openReligiousRecord(place)}
                >
                  <span>
                    <b>{place.place_name}</b>
                    <br />
                    <small>
                      {place.place_type || "-"} • {place.area || "-"} •{" "}
                      {place.police_station || "-"}
                    </small>
                  </span>
                  <span
                    className={`risk-badge ${(
                      place.risk_level || "low"
                    ).toLowerCase()}`}
                  >
                    {place.risk_level || "Low"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* UNIVERSAL RECORD DETAILS MODAL */}
      <RecordDetailsModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}

export default Dashboard;