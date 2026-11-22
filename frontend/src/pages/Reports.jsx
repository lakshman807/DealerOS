import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  GitMerge,
  Copy,
  Download,
  RefreshCw,
  FileBarChart,
  Search,
  CalendarDays,
} from "lucide-react";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { getReconciliation } from "../api/api";
import { useNavigate } from "react-router-dom";
import "./Reports.css";

const COLORS = [
  "#16a34a",
  "#0d9488",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#ea580c",
];

const STATUS_LABELS = {
  MATCHED: "Matched",
  SPLIT_MATCHED: "Split Matched",
  MISMATCH: "Mismatched",
  MULTIPLE_ENTRIES_AMOUNT_MISMATCH: "Multiple Entry Mismatch",
  DUPLICATE_IN_SYSTEM_B: "Duplicate",
  MISSING_IN_SYSTEM_A: "Missing in A",
  MISSING_IN_SYSTEM_B: "Missing in B",
};

const getStatusLabel = (status) =>
  STATUS_LABELS[status] || status?.replaceAll("_", " ") || "Unknown";

const getEntries = (record) => {
  if (!record?.system_b) return [];

  return Array.isArray(record.system_b)
    ? record.system_b
    : [record.system_b];
};

const getRecordDates = (record) => {
  const dates = [
    record.system_a_date,
    record.system_b_date,
    ...getEntries(record).map((entry) => entry.date),
  ];

  return dates.filter(Boolean);
};

const formatAmount = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return Number(value).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function Reports() {
  const navigate = useNavigate();
  const orgId = localStorage.getItem("organization") || "";

  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FILTER STATES
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // FETCH REPORT DATA
  const fetchReports = useCallback(async () => {
    if (!orgId) {
      setRecords([]);
      setError("No organization is assigned to this account. Please sign in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getReconciliation(orgId);

      setRecords(data.results || []);
    } catch (err) {
      console.error("Reports API Error:", err);

      setRecords([]);

      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("username");
        localStorage.removeItem("organization");
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.status === 403
          ? "Access denied. Your account cannot view this organization's reports."
          : err.response?.data?.error || "Unable to load report data."
      );
    } finally {
      setLoading(false);
    }
  }, [orgId, navigate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // DATE VALIDATION
  const invalidDateRange =
    startDate && endDate && startDate > endDate;

  // FILTER RECORDS
  const filteredRecords = useMemo(() => {
    if (invalidDateRange) return [];

    return records.filter((record) => {
      const dates = getRecordDates(record);

      const matchesDate =
        (!startDate && !endDate) ||
        dates.some((date) => {
          return (
            (!startDate || date >= startDate) &&
            (!endDate || date <= endDate)
          );
        });

      const matchesStatus =
        statusFilter === "ALL" ||
        record.status === statusFilter;

      const searchText = search.trim().toLowerCase();

      const entries = getEntries(record);

      const matchesSearch =
        !searchText ||
        (record.record_id || "")
          .toLowerCase()
          .includes(searchText) ||
        entries.some((entry) =>
          (entry.entry_id || "")
            .toLowerCase()
            .includes(searchText)
        );

      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [
    records,
    startDate,
    endDate,
    statusFilter,
    search,
    invalidDateRange,
  ]);

  // CALCULATE FILTERED SUMMARY
  const summary = useMemo(() => {
    let systemARecords = 0;
    let systemBEntries = 0;

    let matched = 0;
    let splitMatched = 0;
    let mismatched = 0;
    let multipleEntryMismatches = 0;
    let duplicates = 0;
    let missingInA = 0;
    let missingInB = 0;

    filteredRecords.forEach((record) => {
      const entries = getEntries(record);

      if (record.system_a) {
        systemARecords++;
      }

      if (record.system_b) {
        systemBEntries += entries.length;
      }

      switch (record.status) {
        case "MATCHED":
          matched++;
          break;

        case "SPLIT_MATCHED":
          splitMatched++;
          break;

        case "MISMATCH":
          mismatched++;
          break;

        case "MULTIPLE_ENTRIES_AMOUNT_MISMATCH":
          multipleEntryMismatches++;
          break;

        case "DUPLICATE_IN_SYSTEM_B":
          duplicates++;
          break;

        case "MISSING_IN_SYSTEM_A":
          missingInA++;
          break;

        case "MISSING_IN_SYSTEM_B":
          missingInB++;
          break;

        default:
          break;
      }
    });

    return {
      systemARecords,
      systemBEntries,
      matched,
      splitMatched,
      mismatched,
      multipleEntryMismatches,
      duplicates,
      missingInA,
      missingInB,
      missing: missingInA + missingInB,
      totalResults: filteredRecords.length,
    };
  }, [filteredRecords]);

  // PIE CHART DATA
  const pieData = [
    { name: "Matched", value: summary.matched },
    { name: "Split Matched", value: summary.splitMatched },
    { name: "Mismatched", value: summary.mismatched },
    {
      name: "Multiple Entry Mismatches",
      value: summary.multipleEntryMismatches,
    },
    { name: "Duplicates", value: summary.duplicates },
    { name: "Missing", value: summary.missing },
  ].filter((item) => item.value > 0);

  // BAR CHART DATA
  const barData = [
    {
      name: "System A",
      records: summary.systemARecords,
    },
    {
      name: "System B",
      records: summary.systemBEntries,
    },
  ];

  // STATUS DATA
  const statusData = [
    {
      name: "Matched",
      value: summary.matched,
      color: "#16a34a",
      icon: <CheckCircle size={19} />,
    },
    {
      name: "Split Matched",
      value: summary.splitMatched,
      color: "#0d9488",
      icon: <GitMerge size={19} />,
    },
    {
      name: "Mismatched",
      value: summary.mismatched,
      color: "#d97706",
      icon: <AlertTriangle size={19} />,
    },
    {
      name: "Multiple Entry Mismatches",
      value: summary.multipleEntryMismatches,
      color: "#ea580c",
      icon: <Copy size={19} />,
    },
    {
      name: "Duplicates",
      value: summary.duplicates,
      color: "#8b5cf6",
      icon: <Copy size={19} />,
    },
    {
      name: "Missing Records",
      value: summary.missing,
      color: "#dc2626",
      icon: <XCircle size={19} />,
    },
  ];

  // CLEAR FILTERS
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("ALL");
    setSearch("");
  };

  // CSV ESCAPING
  const escapeCSV = (value) => {
    let text = String(value ?? "");

    if (/^[\s]*[=+\-@\t\r]/.test(text)) {
      text = `'${text}`;
    }

    return `"${text.replace(/"/g, '""')}"`;
  };

  // EXPORT CSV
  const exportReport = () => {
    if (filteredRecords.length === 0) {
      alert("No records available to export.");
      return;
    }

    const rows = [
      [
        "Organization",
        "Record ID",
        "System B Entry IDs",
        "System A Amount",
        "System B Amount",
        "System A Date",
        "System B Date",
        "System A Location",
        "System B Location",
        "Status",
        "Differences",
      ],
    ];

    filteredRecords.forEach((record) => {
      const entries = getEntries(record);

      rows.push([
        orgId,
        record.record_id,
        entries.map((entry) => entry.entry_id).join(" | "),
        record.system_a_amount ?? "",
        record.system_b_combined_amount ??
          record.system_b_amount ??
          "",
        record.system_a_date ?? "",
        entries.map((entry) => entry.date).filter(Boolean).join(" | ") ||
          record.system_b_date ||
          "",
        record.system_a_location ?? "",
        entries.map((entry) => entry.location).filter(Boolean).join(" | "),
        getStatusLabel(record.status),
        (record.differences || []).join(" | "),
      ]);
    });

    const csvContent = rows
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;

    link.download =
      `DealerOS_${orgId}_Filtered_Report_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // EXPORT PROFESSIONAL PDF
  const exportPDF = () => {
    if (filteredRecords.length === 0) {
      alert("No records available to export.");
      return;
    }

    const doc = new jsPDF("landscape");

    // TITLE
    doc.setFontSize(21);
    doc.setTextColor(49, 86, 211);
    doc.text("DealerOS", 14, 17);

    doc.setFontSize(16);
    doc.setTextColor(35, 45, 65);
    doc.text("Reconciliation Report", 14, 27);

    // ORGANIZATION INFORMATION
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);

    doc.text(`Organization: ${orgId}`, 14, 37);

    doc.text(
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      14,
      44
    );

    doc.text(
      `Date Range: ${startDate || "All"} to ${endDate || "All"}`,
      14,
      51
    );

    doc.text(
      `Status Filter: ${
        statusFilter === "ALL"
          ? "All Status"
          : getStatusLabel(statusFilter)
      }`,
      14,
      58
    );

    // SUMMARY TABLE
    autoTable(doc, {
      startY: 65,
      head: [["Metric", "Count"]],
      body: [
        ["System A Records", summary.systemARecords],
        ["System B Entries", summary.systemBEntries],
        ["Matched", summary.matched],
        ["Split Matched", summary.splitMatched],
        ["Mismatched", summary.mismatched],
        ["Multiple Entry Mismatches", summary.multipleEntryMismatches],
        ["Duplicates", summary.duplicates],
        ["Missing Records", summary.missing],
        ["Total Results", summary.totalResults],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [49, 86, 211],
      },
      styles: {
        fontSize: 9,
      },
    });

    // TRANSACTION TABLE
    const transactionRows = filteredRecords.map((record) => {
      const entries = getEntries(record);

      return [
        record.record_id || "-",
        entries.map((entry) => entry.entry_id).join(", ") || "-",
        record.system_a_amount ?? "-",
        record.system_b_combined_amount ??
          record.system_b_amount ??
          "-",
        record.system_a_date || "-",
        entries.map((entry) => entry.date).filter(Boolean).join(", ") ||
          record.system_b_date ||
          "-",
        getStatusLabel(record.status),
      ];
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,

      head: [[
        "Record ID",
        "System B Entry",
        "System A Amount",
        "System B Amount",
        "System A Date",
        "System B Date",
        "Status",
      ]],

      body: transactionRows,

      theme: "striped",

      headStyles: {
        fillColor: [49, 86, 211],
      },

      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },

      margin: {
        left: 14,
        right: 14,
        bottom: 18,
      },
    });

    // FOOTER ON EVERY PAGE
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setFontSize(8);
      doc.setTextColor(120);

      doc.text(
        `DealerOS | ${orgId} | Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 8
      );
    }

    // DOWNLOAD PDF
    doc.save(
      `DealerOS_${orgId}_Reconciliation_Report_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`
    );
  };

  return (
    <div className="reports-page">

      {/* HEADER */}
      <div className="reports-header">

        <div>
          <h1>Reports & Analytics</h1>

          <p>
            Analyze reconciliation performance and transaction statistics.
          </p>
        </div>

        <div className="reports-actions">

          <button
            className="report-pdf-button"
            onClick={exportPDF}
            disabled={loading || filteredRecords.length === 0}
          >
            <FileBarChart size={17} />
            Download PDF
          </button>

          <button
            className="report-export-button"
            onClick={exportReport}
            disabled={loading || filteredRecords.length === 0}
          >
            <Download size={17} />
            Export CSV
          </button>

          <button
            className="report-refresh-button"
            onClick={fetchReports}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "report-spin" : ""}
            />
            Refresh
          </button>

        </div>
      </div>

      {/* AUTHENTICATED ORGANIZATION */}
      <div className="report-organization">
        <span>Organization:</span>
        <strong>{orgId || "Not assigned"}</strong>
      </div>

      {/* ERROR */}
      {error && (
        <div className="report-error">
          {error}
        </div>
      )}

      {/* ADVANCED FILTERS */}
      <div className="advanced-filter-card">

        <div className="filter-heading">

          <div>
            <h2>
              <CalendarDays size={20} />
              Advanced Filters
            </h2>

            <p>
              Filter reconciliation records by date, status and ID.
            </p>
          </div>

          <button
            className="clear-filter-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </div>

        <div className="advanced-filter-grid">

          <div className="filter-field">
            <label>Start Date</label>

            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label>End Date</label>

            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label>Transaction Status</label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="MATCHED">Matched</option>
              <option value="SPLIT_MATCHED">Split Matched</option>
              <option value="MISMATCH">Mismatched</option>

              <option value="MULTIPLE_ENTRIES_AMOUNT_MISMATCH">
                Multiple Entry Mismatch
              </option>

              <option value="DUPLICATE_IN_SYSTEM_B">
                Duplicate
              </option>

              <option value="MISSING_IN_SYSTEM_A">
                Missing in A
              </option>

              <option value="MISSING_IN_SYSTEM_B">
                Missing in B
              </option>
            </select>
          </div>

          <div className="filter-field">
            <label>Search Transaction</label>

            <div className="report-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="Record ID or Entry ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

        </div>

        {invalidDateRange && (
          <p className="date-error">
            Start date cannot be later than end date.
          </p>
        )}

        <div className="filter-result-count">
          Showing <strong>{filteredRecords.length}</strong> of{" "}
          <strong>{records.length}</strong> records
        </div>

      </div>

      {/* LOADING */}
      {loading ? (
        <div className="report-loading">
          Loading report data...
        </div>
      ) : (
        <>

          {/* SUMMARY CARDS */}
          <div className="report-summary-grid">

            <div className="report-card">
              <div>
                <p>System A Records</p>
                <h2>{summary.systemARecords}</h2>
              </div>

              <Database className="report-blue" size={25} />
            </div>

            <div className="report-card">
              <div>
                <p>System B Entries</p>
                <h2>{summary.systemBEntries}</h2>
              </div>

              <Database className="report-purple" size={25} />
            </div>

            <div className="report-card">
              <div>
                <p>Matched Transactions</p>
                <h2>{summary.matched}</h2>
              </div>

              <CheckCircle className="report-green" size={25} />
            </div>

            <div className="report-card">
              <div>
                <p>Mismatched Transactions</p>
                <h2>{summary.mismatched}</h2>
              </div>

              <AlertTriangle className="report-orange" size={25} />
            </div>

          </div>

          {/* CHARTS */}
          <div className="report-charts-grid">

            {/* PIE CHART */}
            <div className="report-chart-card">

              <div className="report-chart-heading">
                <h2>Transaction Distribution</h2>
                <p>Status-wise transaction breakdown</p>
              </div>

              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>

                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      innerRadius={65}
                      paddingAngle={3}
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip />
                    <Legend />

                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="report-empty">
                  No chart data available.
                </div>
              )}

            </div>

            {/* BAR CHART */}
            <div className="report-chart-card">

              <div className="report-chart-heading">
                <h2>System Comparison</h2>
                <p>Compare records in the selected period</p>
              </div>

              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="name" />

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Bar
                    dataKey="records"
                    name="Total Records"
                    fill="#4f46e5"
                    radius={[7, 7, 0, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>

          </div>

          {/* STATUS REPORT */}
          <div className="report-status-card">

            <div className="report-chart-heading">
              <h2>Reconciliation Status Report</h2>

              <p>
                Detailed status-wise summary for {orgId}
              </p>
            </div>

            <div className="report-status-list">

              {statusData.map((item) => (
                <div
                  className="report-status-row"
                  key={item.name}
                >
                  <div className="report-status-name">
                    <span style={{ color: item.color }}>
                      {item.icon}
                    </span>

                    <span>{item.name}</span>
                  </div>

                  <strong>{item.value}</strong>
                </div>
              ))}

            </div>

          </div>

          {/* FILTERED TRANSACTION TABLE */}
          <div className="report-table-card">

            <div className="report-chart-heading">
              <h2>Filtered Transaction Records</h2>

              <p>
                Transactions matching your selected filters
              </p>
            </div>

            <div className="report-table-scroll">

              <table className="report-table">

                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>System A Amount</th>
                    <th>System B Amount</th>
                    <th>System A Date</th>
                    <th>System B Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="report-empty">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, index) => (
                      <tr key={`${record.record_id}-${index}`}>

                        <td className="report-record-id">
                          {record.record_id}
                        </td>

                        <td>
                          {formatAmount(record.system_a_amount)}
                        </td>

                        <td>
                          {formatAmount(
                            record.system_b_combined_amount ??
                              record.system_b_amount
                          )}
                        </td>

                        <td>
                          {record.system_a_date || "—"}
                        </td>

                        <td>
                          {record.system_b_date || "—"}
                        </td>

                        <td>
                          <span
                            className={`report-status-badge ${
                              record.status.toLowerCase()
                            }`}
                          >
                            {getStatusLabel(record.status)}
                          </span>
                        </td>

                      </tr>
                    ))
                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* REPORT INFORMATION */}
          <div className="report-information">

            <FileBarChart size={23} />

            <div>
              <h3>Report Information</h3>

              <p>
                Organization: <strong>{orgId}</strong>
              </p>

              <p>
                Filtered reconciliation results:{" "}
                <strong>{filteredRecords.length}</strong>
              </p>

              <p>
                Report generated:{" "}
                <strong>
                  {new Date().toLocaleString("en-IN")}
                </strong>
              </p>
            </div>

          </div>

        </>
      )}

    </div>
  );
}

export default Reports;