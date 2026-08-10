import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Search,
  CalendarDays,
  MapPin,
  ShieldAlert,
  Store,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { getReligiousPlaces } from "../api/religiousPlaceApi";
import { getFestivalPermissions } from "../api/festivalApi";
import { getOtherPlaces } from "../api/otherPlaceApi";
import VoiceField from "../components/common/VoiceField";

function Reports() {
  const [places, setPlaces] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [otherPlaces, setOtherPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reportType, setReportType] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadData = async () => {
    try {
      setLoading(true);
      const [placeRes, festivalRes, otherRes] = await Promise.all([
        getReligiousPlaces(),
        getFestivalPermissions(),
        getOtherPlaces(),
      ]);

      setPlaces(placeRes.data.data || []);
      setFestivals(festivalRes.data.data || []);
      setOtherPlaces(otherRes.data.data || []);
    } catch (error) {
      console.error("Failed to load report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const highRisk = places.filter((p) => p.risk_level === "High");
  const pendingFestivals = festivals.filter(
    (f) => f.permission_status === "Pending"
  );
  const totalCount = places.length + festivals.length + otherPlaces.length;

  const getBaseReportRows = () => {
    if (reportType === "places") {
      return places.map((p) => ({
        ...p,
        recordType: "Religious Place",
        name: p.place_name,
        category: p.place_type || "-",
        area: p.area || "-",
        status: p.risk_level || "Low",
        contact: p.contact_person || "-",
        mobile: p.contact_mobile || "-",
      }));
    }

    if (reportType === "festivals") {
      return festivals.map((f) => ({
        ...f,
        recordType: "Festival Mandal",
        name: f.organizer_name || f.mandal_name || f.festival_name || "-",
        category: f.festival_name || "-",
        area: f.area || "-",
        status: f.permission_status || "Pending",
        contact: f.president_name || f.organizer_name || "-",
        mobile: f.president_mobile || f.organizer_mobile || "-",
      }));
    }

    if (reportType === "other") {
      return otherPlaces.map((o) => ({
        ...o,
        recordType: "Other City Data",
        name: o.place_name,
        category: o.category || "-",
        area: o.area || "-",
        status: "Active",
        contact: o.owner_name || o.contact_person || "-",
        mobile: o.mobile || "-",
      }));
    }

    if (reportType === "high") {
      return highRisk.map((p) => ({
        ...p,
        recordType: "Religious Place (High Risk)",
        name: p.place_name,
        category: p.place_type || "-",
        area: p.area || "-",
        status: "High Risk",
        contact: p.contact_person || "-",
        mobile: p.contact_mobile || "-",
      }));
    }

    if (reportType === "pending") {
      return pendingFestivals.map((f) => ({
        ...f,
        recordType: "Festival Mandal (Pending)",
        name: f.organizer_name || f.mandal_name || f.festival_name || "-",
        category: f.festival_name || "-",
        area: f.area || "-",
        status: "Pending Permission",
        contact: f.president_name || f.organizer_name || "-",
        mobile: f.president_mobile || f.organizer_mobile || "-",
      }));
    }

    return [
      ...places.map((p) => ({
        ...p,
        recordType: "Religious Place",
        name: p.place_name,
        category: p.place_type || "-",
        area: p.area || "-",
        status: p.risk_level || "Low",
        contact: p.contact_person || "-",
        mobile: p.contact_mobile || "-",
      })),
      ...festivals.map((f) => ({
        ...f,
        recordType: "Festival Mandal",
        name: f.organizer_name || f.mandal_name || f.festival_name || "-",
        category: f.festival_name || "-",
        area: f.area || "-",
        status: f.permission_status || "Pending",
        contact: f.president_name || f.organizer_name || "-",
        mobile: f.president_mobile || f.organizer_mobile || "-",
      })),
      ...otherPlaces.map((o) => ({
        ...o,
        recordType: "Other City Data",
        name: o.place_name,
        category: o.category || "-",
        area: o.area || "-",
        status: "Active",
        contact: o.owner_name || o.contact_person || "-",
        mobile: o.mobile || "-",
      })),
    ];
  };

  const filteredRows = getBaseReportRows().filter((item) => {
    const q = searchText.toLowerCase().trim();

    const matchesSearch =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.area?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q) ||
      item.contact?.toLowerCase().includes(q) ||
      String(item.mobile || "").includes(q);

    const matchesStatus =
      statusFilter === "All" ||
      item.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getReportTitle = () => {
    switch (reportType) {
      case "places":
        return "Religious Places Official Report";
      case "festivals":
        return "Festival Permissions Official Report";
      case "other":
        return "Other City Places Official Report";
      case "high":
        return "High Risk Locations Police Audit";
      case "pending":
        return "Pending Festival Permission Requests";
      default:
        return "All City Locations & Permits Comprehensive Report";
    }
  };

  const handlePrint = () => {
    const printArea = document.getElementById("reports-print-table-area");
    if (!printArea) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${getReportTitle()}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 30px;
              color: #0f172a;
              background: #ffffff;
            }
            .report-header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 18px;
              border-bottom: 3px solid #0b3d91;
              padding-bottom: 18px;
              margin-bottom: 24px;
            }
            .report-header img {
              width: 72px;
              height: 72px;
              object-fit: contain;
            }
            .report-header h1 {
              margin: 0;
              font-size: 26px;
              font-weight: 800;
              color: #0b1f3a;
              text-transform: uppercase;
            }
            .report-header h2 {
              margin: 4px 0 0;
              font-size: 16px;
              color: #0b3d91;
              text-align: center;
            }
            .report-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 22px;
              font-size: 13px;
              color: #475569;
              background: #f8fafc;
              padding: 12px 16px;
              border-radius: 8px;
            }
            .report-title-card {
              background: #eef6ff;
              border-left: 5px solid #0b3d91;
              padding: 14px 18px;
              border-radius: 10px;
              margin-bottom: 22px;
            }
            .report-title-card h3 {
              margin: 0;
              font-size: 20px;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th {
              background: #0b3d91;
              color: white;
              padding: 10px 12px;
              font-size: 12px;
              text-align: left;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 12px;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            .footer {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #475569;
            }
            .sign {
              text-align: center;
            }
            .sign-line {
              width: 180px;
              border-top: 1px solid #0f172a;
              margin: 0 auto 8px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <img src="/police-logo.png" />
            <div>
              <h1>Chhavani Police Station</h1>
              <h2>Malegaon City Police Management System</h2>
            </div>
          </div>

          <div class="report-meta">
            <span><b>Date & Time:</b> ${new Date().toLocaleString()}</span>
            <span><b>Selected Filter:</b> ${getReportTitle()}</span>
            <span><b>Total Records:</b> ${filteredRows.length}</span>
          </div>

          <div class="report-title-card">
            <h3>${getReportTitle()}</h3>
            <p>Official police management report generated from live city database records.</p>
          </div>

          ${printArea.innerHTML}

          <div class="footer">
            <span>Generated by Police City Management System V2</span>
            <div class="sign">
              <div class="sign-line"></div>
              <b>Officer In-Charge Signature</b>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.error("No records available to export");
      return;
    }

    const headers = ["Record Type", "Name", "Category / Type", "Area", "Status / Risk", "Contact Person", "Mobile"];
    const csvRows = filteredRows.map((r) => [
      `"${r.recordType || ""}"`,
      `"${r.name || ""}"`,
      `"${r.category || ""}"`,
      `"${r.area || ""}"`,
      `"${r.status || ""}"`,
      `"${r.contact || ""}"`,
      `"${r.mobile || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-police-report-${Date.now()}.csv`;
    a.click();

    toast.success(`Exported ${filteredRows.length} records to CSV`);
  };

  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      toast.error("No records available to export");
      return;
    }

    const headers = ["Record Type", "Name", "Category / Type", "Area", "Status / Risk", "Contact Person", "Mobile"];
    const tsvRows = filteredRows.map((r) => [
      r.recordType || "",
      r.name || "",
      r.category || "",
      r.area || "",
      r.status || "",
      r.contact || "",
      r.mobile || "",
    ]);

    const tsvContent = [headers.join("\t"), ...tsvRows.map((row) => row.join("\t"))].join("\n");
    const blob = new Blob([tsvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-police-report-${Date.now()}.xls`;
    a.click();

    toast.success(`Exported ${filteredRows.length} records to Excel`);
  };

  return (
    <div className="reports-page-container">
      {/* PAGE HEADER */}
      <div className="reports-header-card">
        <div className="reports-header-title">
          <FileText size={28} className="header-icon-teal" />
          <div>
            <h2>Reports & Export Center</h2>
            <p>Generate official police management reports and export live city records</p>
          </div>
        </div>

        <div className="reports-actions-bar">
          <button type="button" className="secondary-btn" onClick={handlePrint}>
            <Printer size={16} />
            Print Report
          </button>
          <button type="button" className="secondary-btn" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} />
            Export Excel
          </button>
          <button type="button" className="primary-btn" onClick={handleExportCSV}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="reports-kpi-grid">
        <div className="reports-kpi-card blue">
          <FileText size={22} />
          <div>
            <h3>{loading ? "..." : totalCount}</h3>
            <span>Total City Records</span>
          </div>
        </div>

        <div className="reports-kpi-card teal">
          <MapPin size={22} />
          <div>
            <h3>{loading ? "..." : places.length}</h3>
            <span>Religious Places</span>
          </div>
        </div>

        <div className="reports-kpi-card amber">
          <CalendarDays size={22} />
          <div>
            <h3>{loading ? "..." : festivals.length}</h3>
            <span>Festival Permissions</span>
          </div>
        </div>

        <div className="reports-kpi-card emerald">
          <Store size={22} />
          <div>
            <h3>{loading ? "..." : otherPlaces.length}</h3>
            <span>Other City Data</span>
          </div>
        </div>

        <div className="reports-kpi-card red">
          <ShieldAlert size={22} />
          <div>
            <h3>{loading ? "..." : highRisk.length}</h3>
            <span>High Risk Locations</span>
          </div>
        </div>
      </div>

      {/* EXPORT DATA TYPE SELECTOR */}
      <div className="reports-filter-section">
        <div className="section-label-row">
          <Filter size={16} />
          <span>EXPORT DATA FILTER</span>
        </div>

        <div className="report-type-pills">
          <button
            type="button"
            className={`report-pill ${reportType === "all" ? "active" : ""}`}
            onClick={() => setReportType("all")}
          >
            {reportType === "all" && <CheckCircle2 size={15} />}
            ALL RECORDS ({totalCount})
          </button>

          <button
            type="button"
            className={`report-pill ${reportType === "places" ? "active" : ""}`}
            onClick={() => setReportType("places")}
          >
            {reportType === "places" && <CheckCircle2 size={15} />}
            RELIGIOUS PLACES ({places.length})
          </button>

          <button
            type="button"
            className={`report-pill ${reportType === "festivals" ? "active" : ""}`}
            onClick={() => setReportType("festivals")}
          >
            {reportType === "festivals" && <CheckCircle2 size={15} />}
            FESTIVAL PERMISSIONS ({festivals.length})
          </button>

          <button
            type="button"
            className={`report-pill ${reportType === "other" ? "active" : ""}`}
            onClick={() => setReportType("other")}
          >
            {reportType === "other" && <CheckCircle2 size={15} />}
            OTHER PLACES ({otherPlaces.length})
          </button>

          <button
            type="button"
            className={`report-pill red ${reportType === "high" ? "active" : ""}`}
            onClick={() => setReportType("high")}
          >
            {reportType === "high" && <CheckCircle2 size={15} />}
            HIGH RISK ({highRisk.length})
          </button>

          <button
            type="button"
            className={`report-pill amber ${reportType === "pending" ? "active" : ""}`}
            onClick={() => setReportType("pending")}
          >
            {reportType === "pending" && <CheckCircle2 size={15} />}
            PENDING ({pendingFestivals.length})
          </button>
        </div>
      </div>

      {/* SECONDARY TOOLBAR: SEARCH & STATUS */}
      <div className="reports-toolbar">
        <div className="reports-search-box">
          <Search size={18} className="search-icon-teal" />
          <VoiceField
            name="searchText"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search report by name, area, type, contact..."
          />
        </div>

        <div className="reports-secondary-controls">
          <select
            className="reports-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status / Risk</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* REPORT SUMMARY BADGE */}
      <div className="reports-export-summary">
        <div>
          <b>Selected Report:</b> {getReportTitle()}
        </div>
        <div>
          <b>Matching Records:</b> {filteredRows.length} of {totalCount}
        </div>
      </div>

      {/* REPORT PREVIEW TABLE */}
      <div className="reports-preview-card" id="reports-print-table-area">
        <div className="preview-card-header">
          <h3>{getReportTitle()}</h3>
          <span className="preview-count-chip">{filteredRows.length} Rows</span>
        </div>

        <div className="table-responsive">
          <table className="professional-table">
            <thead>
              <tr>
                <th>Record Type</th>
                <th>Name</th>
                <th>Category / Type</th>
                <th>Area / Ward</th>
                <th>Status / Risk</th>
                <th>Contact Person</th>
                <th>Mobile</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="empty-report-state">
                      <FileText size={36} className="text-muted mb-2" />
                      <h4>No report records found</h4>
                      <p>Try changing the selected filters or search text.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((item, index) => (
                  <tr key={`${item.recordType}-${item.id || index}`}>
                    <td>
                      <span className="record-type-chip">{item.recordType}</span>
                    </td>
                    <td><b>{item.name}</b></td>
                    <td>{item.category}</td>
                    <td>{item.area}</td>
                    <td>
                      <span
                        className={`status-pill-chip ${String(
                          item.status
                        ).toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.contact}</td>
                    <td>
                      {item.mobile !== "-" ? (
                        <a href={`tel:${item.mobile}`} className="phone-link">
                          {item.mobile}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;