import { useEffect, useState } from "react";
import {
  BarChart3,
  ShieldAlert,
  Landmark,
  CalendarCheck,
  Store,
  RefreshCcw,
  Radio,
  Sparkles,
  PieChart,
  ShieldCheck,
  AlertCircle,
  Activity,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { getReligiousPlaces } from "../api/religiousPlaceApi";
import { getFestivalPermissions } from "../api/festivalApi";
import { getOtherPlaces } from "../api/otherPlaceApi";

function Analytics() {
  const [places, setPlaces] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [otherPlaces, setOtherPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);

      const [placeRes, festivalRes, otherRes] = await Promise.all([
        getReligiousPlaces(),
        getFestivalPermissions(),
        getOtherPlaces(),
      ]);

      setPlaces(placeRes.data.data || []);
      setFestivals(festivalRes.data.data || []);
      setOtherPlaces(otherRes.data.data || []);
      toast.success("Analytics data updated");
    } catch (err) {
      console.error("Analytics load error:", err);
      setError(true);
      toast.error("Unable to load latest city analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRecords = places.length + festivals.length + otherPlaces.length;

  const countRisk = (risk) =>
    places.filter((p) => (p.risk_level || "Low").toLowerCase() === risk.toLowerCase()).length;

  const lowRiskCount = countRisk("Low");
  const mediumRiskCount = countRisk("Medium");
  const highRiskCount = countRisk("High");

  const countStatus = (status) =>
    festivals.filter(
      (f) => (f.permission_status || "Pending").toLowerCase() === status.toLowerCase()
    ).length;

  const approvedCount = countStatus("Approved");
  const pendingCount = countStatus("Pending");
  const rejectedCount = countStatus("Rejected");

  const countByType = (type) =>
    places.filter((p) => (p.place_type || "").toLowerCase().includes(type.toLowerCase())).length;

  const templeCount = countByType("Temple") + countByType("Mandir");
  const masjidCount = countByType("Masjid") + countByType("Mosque");
  const dargahCount = countByType("Dargah");
  const churchCount = countByType("Church");
  const gurudwaraCount = countByType("Gurudwara");

  // Other Places category counts derived dynamically
  const otherCategories = otherPlaces.reduce((acc, item) => {
    const cat = item.category || "General";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const otherCategoryList = Object.entries(otherCategories).sort((a, b) => b[1] - a[1]);

  const calcPercent = (val, total = totalRecords) => {
    if (!total || total === 0) return "0.0";
    return ((val / total) * 100).toFixed(1);
  };

  // Generate dynamic city insights from real data
  const generateInsights = () => {
    const insights = [];

    if (highRiskCount > 0) {
      insights.push(
        `${highRiskCount} location${highRiskCount > 1 ? "s are" : " is"} designated as High Risk requiring active police monitoring.`
      );
    } else {
      insights.push("No locations are currently marked as High Risk.");
    }

    if (pendingCount > 0) {
      insights.push(
        `${pendingCount} festival permission request${pendingCount > 1 ? "s are" : " is"} currently pending officer verification.`
      );
    } else if (festivals.length > 0) {
      insights.push("All submitted festival permission applications have been processed.");
    }

    if (places.length > 0) {
      const religiousShare = calcPercent(places.length, totalRecords);
      insights.push(
        `Religious places represent ${religiousShare}% of all registered city infrastructure records.`
      );
    }

    if (otherPlaces.length > 0) {
      insights.push(
        `${otherPlaces.length} civic and commercial locations recorded across police station divisions.`
      );
    }

    return insights;
  };

  return (
    <div className="analytics-page-container">
      {/* PAGE HEADER */}
      <div className="analytics-header-card">
        <div className="header-title-block">
          <div className="live-status-pill">
            <Radio size={14} className="pulse-dot" />
            <span>LIVE DATA</span>
          </div>
          <h2>Analytics & City Insights</h2>
          <p>Real-time operational overview of Malegaon City records, permits, and risk levels</p>
        </div>

        <button
          type="button"
          className="secondary-btn btn-refresh"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCcw size={16} className={loading ? "spin-icon" : ""} />
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="analytics-error-banner">
          <AlertTriangle size={24} />
          <div>
            <h4>Analytics Unavailable</h4>
            <p>Unable to connect to live database. Please retry.</p>
          </div>
          <button type="button" className="primary-btn btn-sm" onClick={loadData}>
            Retry Data Load
          </button>
        </div>
      )}

      {/* SKELETON LOADING STATE */}
      {loading ? (
        <div className="analytics-skeleton-wrapper">
          <div className="skeleton-kpi-grid">
            <div className="skeleton-box kpi-skel"></div>
            <div className="skeleton-box kpi-skel"></div>
            <div className="skeleton-box kpi-skel"></div>
            <div className="skeleton-box kpi-skel"></div>
            <div className="skeleton-box kpi-skel"></div>
          </div>
          <div className="skeleton-grid">
            <div className="skeleton-box card-skel"></div>
            <div className="skeleton-box card-skel"></div>
          </div>
        </div>
      ) : totalRecords === 0 && !error ? (
        /* EMPTY STATE */
        <div className="analytics-empty-card">
          <BarChart3 size={48} className="empty-icon" />
          <h3>No Analytics Data Available</h3>
          <p>Add religious places, festival permits or other city records to populate analytics.</p>
          <button type="button" className="primary-btn mt-4" onClick={loadData}>
            Reload Data
          </button>
        </div>
      ) : (
        <>
          {/* 5 KPI CARDS GRID */}
          <div className="analytics-kpi-grid">
            <div className="analytics-kpi-card blue">
              <div className="kpi-icon-box blue">
                <BarChart3 size={22} />
              </div>
              <div className="kpi-body">
                <h3>{totalRecords}</h3>
                <span>Total City Records</span>
              </div>
            </div>

            <div className="analytics-kpi-card teal">
              <div className="kpi-icon-box teal">
                <Landmark size={22} />
              </div>
              <div className="kpi-body">
                <h3>{places.length}</h3>
                <span>Religious Places</span>
              </div>
            </div>

            <div className="analytics-kpi-card amber">
              <div className="kpi-icon-box amber">
                <CalendarCheck size={22} />
              </div>
              <div className="kpi-body">
                <h3>{festivals.length}</h3>
                <span>Festival Permissions</span>
              </div>
            </div>

            <div className="analytics-kpi-card emerald">
              <div className="kpi-icon-box emerald">
                <Store size={22} />
              </div>
              <div className="kpi-body">
                <h3>{otherPlaces.length}</h3>
                <span>Other City Data</span>
              </div>
            </div>

            <div className="analytics-kpi-card red">
              <div className="kpi-icon-box red">
                <ShieldAlert size={22} />
              </div>
              <div className="kpi-body">
                <h3>{highRiskCount}</h3>
                <span>High Risk Locations</span>
              </div>
            </div>
          </div>

          {/* ANALYTICS CARDS GRID - ROW 1 */}
          <div className="analytics-main-grid">
            {/* CARD 1: RISK OVERVIEW */}
            <div className="analytics-card">
              <div className="card-header-row">
                <div className="card-title">
                  <ShieldAlert size={18} className="icon-red" />
                  <h3>Risk Overview</h3>
                </div>
                <span className="card-badge">{places.length} Locations</span>
              </div>

              <div className="risk-metrics-row">
                <div className="risk-pill-box low">
                  <ShieldCheck size={16} />
                  <span>Low Risk</span>
                  <b>{lowRiskCount}</b>
                </div>

                <div className="risk-pill-box medium">
                  <AlertCircle size={16} />
                  <span>Medium Risk</span>
                  <b>{mediumRiskCount}</b>
                </div>

                <div className="risk-pill-box high">
                  <ShieldAlert size={16} />
                  <span>High Risk</span>
                  <b>{highRiskCount}</b>
                </div>
              </div>

              <div className="bars-stack">
                <div className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-label green-dot">Low Risk</span>
                    <span className="bar-value-text">{lowRiskCount} ({calcPercent(lowRiskCount, places.length)}%)</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill green"
                      style={{ width: `${calcPercent(lowRiskCount, places.length)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-label amber-dot">Medium Risk</span>
                    <span className="bar-value-text">{mediumRiskCount} ({calcPercent(mediumRiskCount, places.length)}%)</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill amber"
                      style={{ width: `${calcPercent(mediumRiskCount, places.length)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-label red-dot">High Risk</span>
                    <span className="bar-value-text">{highRiskCount} ({calcPercent(highRiskCount, places.length)}%)</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill red"
                      style={{ width: `${calcPercent(highRiskCount, places.length)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: CITY DATA DISTRIBUTION */}
            <div className="analytics-card">
              <div className="card-header-row">
                <div className="card-title">
                  <PieChart size={18} className="icon-blue" />
                  <h3>City Data Distribution</h3>
                </div>
                <span className="card-badge">{totalRecords} Records</span>
              </div>

              <div className="bars-stack">
                <div className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-label">🛕 Religious Places</span>
                    <span className="bar-value-text">{places.length} ({calcPercent(places.length)}%)</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill teal"
                      style={{ width: `${calcPercent(places.length)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-label">🎉 Festival Permissions</span>
                    <span className="bar-value-text">{festivals.length} ({calcPercent(festivals.length)}%)</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill amber"
                      style={{ width: `${calcPercent(festivals.length)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-label">🏪 Other City Data</span>
                    <span className="bar-value-text">{otherPlaces.length} ({calcPercent(otherPlaces.length)}%)</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill emerald"
                      style={{ width: `${calcPercent(otherPlaces.length)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ANALYTICS CARDS GRID - ROW 2 */}
          <div className="analytics-main-grid">
            {/* CARD 3: FESTIVAL PERMISSION STATUS */}
            <div className="analytics-card">
              <div className="card-header-row">
                <div className="card-title">
                  <CalendarCheck size={18} className="icon-amber" />
                  <h3>Festival Permission Status</h3>
                </div>
                <span className="card-badge">{festivals.length} Mandals</span>
              </div>

              <div className="bars-stack">
                <div className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-label green-dot">Approved</span>
                    <span className="bar-value-text">{approvedCount} ({calcPercent(approvedCount, festivals.length)}%)</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill green"
                      style={{ width: `${calcPercent(approvedCount, festivals.length)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-label amber-dot">Pending Approval</span>
                    <span className="bar-value-text">{pendingCount} ({calcPercent(pendingCount, festivals.length)}%)</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill amber"
                      style={{ width: `${calcPercent(pendingCount, festivals.length)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-label red-dot">Rejected / Cancelled</span>
                    <span className="bar-value-text">{rejectedCount} ({calcPercent(rejectedCount, festivals.length)}%)</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill red"
                      style={{ width: `${calcPercent(rejectedCount, festivals.length)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: RELIGIOUS PLACES CATEGORIES */}
            <div className="analytics-card">
              <div className="card-header-row">
                <div className="card-title">
                  <Landmark size={18} className="icon-teal" />
                  <h3>Religious Places Category Breakdown</h3>
                </div>
                <span className="card-badge">{places.length} Places</span>
              </div>

              <div className="bars-stack">
                {[
                  { name: "Temple / Mandir", count: templeCount },
                  { name: "Masjid / Mosque", count: masjidCount },
                  { name: "Dargah", count: dargahCount },
                  { name: "Church", count: churchCount },
                  { name: "Gurudwara", count: gurudwaraCount },
                ].map((item) => (
                  <div className="bar-row" key={item.name}>
                    <div className="bar-label-group">
                      <span className="bar-label">{item.name}</span>
                      <span className="bar-value-text">{item.count} ({calcPercent(item.count, places.length)}%)</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill teal"
                        style={{ width: `${calcPercent(item.count, places.length)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ANALYTICS CARDS GRID - ROW 3 */}
          <div className="analytics-main-grid">
            {/* CARD 5: OTHER PLACES CATEGORY BREAKDOWN */}
            <div className="analytics-card">
              <div className="card-header-row">
                <div className="card-title">
                  <Store size={18} className="icon-emerald" />
                  <h3>Other Places Categories</h3>
                </div>
                <span className="card-badge">{otherPlaces.length} Records</span>
              </div>

              {otherCategoryList.length === 0 ? (
                <p className="no-data-sub">No other place categories recorded.</p>
              ) : (
                <div className="bars-stack">
                  {otherCategoryList.slice(0, 5).map(([cat, count]) => (
                    <div className="bar-row" key={cat}>
                      <div className="bar-label-group">
                        <span className="bar-label">{cat}</span>
                        <span className="bar-value-text">{count} ({calcPercent(count, otherPlaces.length)}%)</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill emerald"
                          style={{ width: `${calcPercent(count, otherPlaces.length)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CARD 6: DYNAMIC CITY INSIGHTS */}
            <div className="analytics-card insights-card">
              <div className="card-header-row">
                <div className="card-title">
                  <Sparkles size={18} className="icon-gold" />
                  <h3>City Operational Insights</h3>
                </div>
                <span className="card-badge blue-badge">Automated Audit</span>
              </div>

              <div className="insights-list">
                {generateInsights().map((insight, idx) => (
                  <div className="insight-item" key={idx}>
                    <Activity size={16} className="insight-icon" />
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;