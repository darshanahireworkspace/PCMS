import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Search,
  FileSpreadsheet,
  Check,
  ChevronRight,
  ShieldAlert,
  CalendarCheck,
  Church,
  Building2,
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
    if (filteredRows.length === 0) {
      toast.error("No records available to print");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocked. Please allow pop-ups to print reports.");
      return;
    }

    const religiousRows = filteredRows.filter((r) =>
      String(r.recordType || "").includes("Religious")
    );
    const festivalRows = filteredRows.filter((r) =>
      String(r.recordType || "").includes("Festival")
    );
    const otherRows = filteredRows.filter((r) =>
      String(r.recordType || "").includes("Other")
    );

    const renderSectionTable = (rows, sectionTitle) => {
      if (rows.length === 0) return "";
      return `
        <div class="report-section">
          <div class="section-header">
            <h4>${sectionTitle}</h4>
            <span class="section-count">${rows.length} Records</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th style="width: 120px;">Record Type</th>
                <th>Name / Mandal</th>
                <th style="width: 120px;">Category / Type</th>
                <th style="width: 110px;">Area / Ward</th>
                <th style="width: 90px; text-align: center;">Status / Risk</th>
                <th style="width: 140px;">Contact & Mobile</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (r, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><span class="type-tag">${r.recordType || "-"}</span></td>
                  <td><b>${r.name || "-"}</b></td>
                  <td>${r.category || "-"}</td>
                  <td>${r.area || "-"}</td>
                  <td style="text-align: center;"><span class="badge ${String(
                    r.status || ""
                  ).toLowerCase()}">${r.status || "-"}</span></td>
                  <td>${r.contact || "-"}<br/><small style="color: #475569;">${
                    r.mobile || "-"
                  }</small></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    };

    let mainContentHtml = "";
    if (reportType === "all") {
      mainContentHtml = `
        ${renderSectionTable(religiousRows, "1. RELIGIOUS PLACES")}
        ${renderSectionTable(festivalRows, "2. FESTIVAL PERMISSIONS")}
        ${renderSectionTable(otherRows, "3. OTHER CITY PLACES")}
      `;
    } else {
      mainContentHtml = renderSectionTable(
        filteredRows,
        getReportTitle().toUpperCase()
      );
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${getReportTitle()} — PCMS V2</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 14mm 14mm 14mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: 16px;
              color: #0f172a;
              background: #ffffff;
              font-size: 11.5px;
              line-height: 1.4;
            }

            /* OFFICIAL POLICE HEADER */
            .official-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px double #0b3d91;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }

            .header-brand {
              display: flex;
              align-items: center;
              gap: 14px;
            }

            .header-logo {
              width: 64px;
              height: 64px;
              object-fit: contain;
            }

            .header-text h5 {
              margin: 0;
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }

            .header-text h2 {
              margin: 2px 0 1px;
              font-size: 18px;
              font-weight: 900;
              color: #0b1f3a;
              letter-spacing: -0.01em;
              text-transform: uppercase;
            }

            .header-text h4 {
              margin: 0;
              font-size: 12px;
              font-weight: 700;
              color: #0b3d91;
            }

            .header-doc-badge {
              text-align: right;
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 6px 12px;
              border-radius: 8px;
            }

            .header-doc-badge b {
              display: block;
              font-size: 12px;
              color: #0b3d91;
            }

            .header-doc-badge span {
              font-size: 10px;
              color: #64748b;
            }

            /* DOCUMENT METADATA GRID */
            .doc-meta-strip {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 16px;
            }

            .meta-item {
              display: flex;
              flex-direction: column;
            }

            .meta-label {
              font-size: 9.5px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }

            .meta-value {
              font-size: 12px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 1px;
            }

            /* SUMMARY BREAKDOWN BAR */
            .summary-breakdown {
              display: flex;
              gap: 20px;
              background: #eef6ff;
              border-left: 4px solid #0b3d91;
              padding: 8px 14px;
              border-radius: 4px;
              margin-bottom: 18px;
              font-size: 11px;
            }

            .summary-breakdown-item {
              display: flex;
              align-items: center;
              gap: 6px;
            }

            .summary-breakdown-item b {
              color: #0b3d91;
            }

            /* SECTIONS & TABLES */
            .report-section {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }

            .section-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: #0b3d91;
              color: #ffffff;
              padding: 6px 12px;
              border-radius: 6px 6px 0 0;
            }

            .section-header h4 {
              margin: 0;
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 0.03em;
            }

            .section-count {
              font-size: 10px;
              font-weight: 700;
              background: rgba(255, 255, 255, 0.2);
              padding: 2px 8px;
              border-radius: 10px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #cbd5e1;
              font-size: 11px;
            }

            thead {
              display: table-header-group;
            }

            th {
              background: #f1f5f9;
              color: #0f172a;
              font-weight: 800;
              text-align: left;
              padding: 7px 9px;
              border: 1px solid #cbd5e1;
              font-size: 10.5px;
              text-transform: uppercase;
            }

            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            tr:nth-child(even) {
              background: #f8fafc;
            }

            td {
              padding: 6px 9px;
              border: 1px solid #e2e8f0;
              vertical-align: middle;
            }

            .type-tag {
              font-size: 9.5px;
              font-weight: 700;
              color: #475569;
              background: #e2e8f0;
              padding: 1px 6px;
              border-radius: 4px;
            }

            .badge {
              display: inline-block;
              font-size: 9.5px;
              font-weight: 800;
              padding: 2px 7px;
              border-radius: 10px;
              text-transform: uppercase;
            }

            .badge.approved, .badge.low, .badge.active {
              background: #dcfce7;
              color: #15803d;
            }

            .badge.pending, .badge.medium {
              background: #fef3c7;
              color: #b45309;
            }

            .badge.high, .badge.rejected {
              background: #fee2e2;
              color: #b91c1c;
            }

            /* OFFICIAL FOOTER SIGNATURE */
            .document-footer {
              margin-top: 36px;
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              padding-top: 14px;
              border-top: 1px solid #cbd5e1;
              page-break-inside: avoid;
            }

            .footer-notes {
              font-size: 10px;
              color: #64748b;
            }

            .signature-block {
              text-align: center;
              width: 220px;
            }

            .sig-line {
              border-top: 1.5px dashed #0f172a;
              margin-bottom: 6px;
            }

            .sig-title {
              font-size: 11px;
              font-weight: 800;
              color: #0f172a;
            }

            .sig-sub {
              font-size: 9.5px;
              color: #64748b;
            }

            @media print {
              body {
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <!-- OFFICIAL HEADER -->
          <div class="official-header">
            <div class="header-brand">
              <img src="/police-logo.png" class="header-logo" alt="Maharashtra Police Logo" />
              <div class="header-text">
                <h5>MAHARASHTRA POLICE</h5>
                <h2>CHHAVANI POLICE STATION, MALEGAON</h2>
                <h4>POLICE CITY MANAGEMENT SYSTEM V2</h4>
              </div>
            </div>
            <div class="header-doc-badge">
              <b>OFFICIAL REPORT</b>
              <span>CONFIDENTIAL</span>
            </div>
          </div>

          <!-- DOCUMENT METADATA STRIP -->
          <div class="doc-meta-strip">
            <div class="meta-item">
              <span class="meta-label">Report Category</span>
              <span class="meta-value">${getReportTitle()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Generated On</span>
              <span class="meta-value">${new Date().toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Records</span>
              <span class="meta-value">${filteredRows.length} Locations</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Issuing Authority</span>
              <span class="meta-value">Chhavani Station HQ</span>
            </div>
          </div>

          <!-- SUMMARY BREAKDOWN BAR -->
          <div class="summary-breakdown">
            <div class="summary-breakdown-item">
              <span>Religious Places:</span>
              <b>${religiousRows.length}</b>
            </div>
            <div class="summary-breakdown-item">
              <span>Festival Permissions:</span>
              <b>${festivalRows.length}</b>
            </div>
            <div class="summary-breakdown-item">
              <span>Other City Places:</span>
              <b>${otherRows.length}</b>
            </div>
          </div>

          <!-- MAIN TABLES CONTENT -->
          ${mainContentHtml}

          <!-- OFFICIAL FOOTER & SIGNATURE BLOCK -->
          <div class="document-footer">
            <div class="footer-notes">
              <p style="margin: 0 0 2px;"><b>Police City Management System V2</b> — Malegaon City Command Center</p>
              <p style="margin: 0;">This is an officially generated computer system report.</p>
            </div>

            <div class="signature-block">
              <div class="sig-line"></div>
              <div class="sig-title">Officer In-Charge Signature</div>
              <div class="sig-sub">Chhavani Police Station, Malegaon</div>
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

    const headers = [
      "Record Type",
      "Name",
      "Category / Type",
      "Area",
      "Status / Risk",
      "Contact Person",
      "Mobile",
    ];
    const csvRows = filteredRows.map((r) => [
      `"${r.recordType || ""}"`,
      `"${r.name || ""}"`,
      `"${r.category || ""}"`,
      `"${r.area || ""}"`,
      `"${r.status || ""}"`,
      `"${r.contact || ""}"`,
      `"${r.mobile || ""}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");
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

    const headers = [
      "Record Type",
      "Name",
      "Category / Type",
      "Area",
      "Status / Risk",
      "Contact Person",
      "Mobile",
    ];
    const tsvRows = filteredRows.map((r) => [
      r.recordType || "",
      r.name || "",
      r.category || "",
      r.area || "",
      r.status || "",
      r.contact || "",
      r.mobile || "",
    ]);

    const tsvContent = [
      headers.join("\t"),
      ...tsvRows.map((row) => row.join("\t")),
    ].join("\n");
    const blob = new Blob([tsvContent], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-police-report-${Date.now()}.xls`;
    a.click();

    toast.success(`Exported ${filteredRows.length} records to Excel`);
  };

  const quickReports = [
    {
      id: "all",
      title: "All Records",
      subtitle: "Complete city management report",
      count: totalCount,
      icon: FileText,
      colorClass: "blue",
    },
    {
      id: "places",
      title: "Religious Places",
      subtitle: "Registered religious locations",
      count: places.length,
      icon: Church,
      colorClass: "teal",
    },
    {
      id: "festivals",
      title: "Festival Permissions",
      subtitle: "Festival and permission records",
      count: festivals.length,
      icon: CalendarCheck,
      colorClass: "purple",
    },
    {
      id: "other",
      title: "Other Places",
      subtitle: "Commercial and civic records",
      count: otherPlaces.length,
      icon: Building2,
      colorClass: "emerald",
    },
    {
      id: "high",
      title: "High Risk Locations",
      subtitle: "Security priority monitoring",
      count: highRisk.length,
      icon: ShieldAlert,
      colorClass: "red",
    },
  ];

  return (
    <div className="reports-redesign-container">
      {/* 1. COMPACT PAGE HEADER */}
      <div className="reports-header-block">
        <div className="reports-header-left">
          <div className="reports-header-icon-box">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="reports-page-title">Reports</h2>
            <p className="reports-page-subtitle">
              Generate and view system reports
            </p>
          </div>
        </div>

        <div className="reports-header-actions">
          <button
            type="button"
            className="secondary-btn btn-sm"
            onClick={handleExportExcel}
          >
            <FileSpreadsheet size={15} />
            Excel
          </button>
          <button
            type="button"
            className="secondary-btn btn-sm"
            onClick={handleExportCSV}
          >
            <Download size={15} />
            CSV
          </button>
          <button
            type="button"
            className="primary-btn btn-sm"
            onClick={handlePrint}
          >
            <Printer size={15} />
            Print / PDF
          </button>
        </div>
      </div>

      {/* 2. QUICK REPORTS SELECTION SECTION */}
      <div className="reports-quick-section">
        <div className="reports-section-title">
          <h3>Quick Reports</h3>
          <p>Choose a report category to get started</p>
        </div>

        <div className="reports-quick-list">
          {quickReports.map((item) => {
            const IconComponent = item.icon;
            const isSelected = reportType === item.id;

            return (
              <div
                key={item.id}
                className={`report-select-row ${isSelected ? "selected" : ""}`}
                onClick={() => setReportType(item.id)}
              >
                <div className="report-row-left">
                  <div className={`report-row-icon ${item.colorClass}`}>
                    <IconComponent size={18} />
                  </div>
                  <div>
                    <h4 className="report-row-title">{item.title}</h4>
                    <p className="report-row-subtitle">{item.subtitle}</p>
                  </div>
                </div>

                <div className="report-row-right">
                  <span className="report-row-badge">
                    {loading ? "..." : item.count} records
                  </span>
                  {isSelected ? (
                    <Check size={18} className="selected-check-icon" />
                  ) : (
                    <ChevronRight size={18} className="chevron-icon" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. REPORT FILTERS BAR */}
      <div className="reports-filter-card">
        <div className="reports-section-title">
          <div className="title-with-icon">
            <Filter size={16} />
            <h3>Report Filters</h3>
          </div>
        </div>

        <div className="reports-filters-grid">
          <div className="reports-search-box">
            <Search size={18} className="gis-search-icon" />
            <VoiceField
              name="searchText"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search report by name, area, type..."
            />
          </div>

          <div className="reports-select-box">
            <select
              className="reports-select-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status / Risk Levels</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. REPORT SUMMARY & ACTION STRIP */}
      <div className="reports-summary-banner">
        <div className="summary-banner-info">
          <div>
            <span className="summary-banner-label">Report Type:</span>
            <b>{getReportTitle()}</b>
          </div>
          <div>
            <span className="summary-banner-label">Filtered Records:</span>
            <b>{filteredRows.length} of {totalCount}</b>
          </div>
        </div>

        <div className="summary-banner-actions">
          <button
            type="button"
            className="primary-btn btn-sm"
            onClick={handlePrint}
          >
            <Printer size={15} />
            Generate Report
          </button>
        </div>
      </div>

      {/* 5. REPORT PREVIEW TABLE */}
      <div className="reports-preview-card" id="reports-print-table-area">
        <div className="preview-card-header">
          <h3>Report Preview</h3>
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
                      <h4>No records available</h4>
                      <p>Try changing the selected report category or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((item, index) => (
                  <tr key={`${item.recordType}-${item.id || index}`}>
                    <td>
                      <span className="record-type-chip">{item.recordType}</span>
                    </td>
                    <td>
                      <b>{item.name}</b>
                    </td>
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