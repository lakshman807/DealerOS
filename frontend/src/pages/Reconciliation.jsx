import { useEffect, useMemo, useState, useCallback } from "react";

import {
  Search,
  RefreshCw,
  Eye,
  X,
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  GitMerge,
  Download,
} from "lucide-react";

import { getReconciliation } from "../api/api";
import "./Reconciliation.css";

const STATUS_LABELS = {
  MATCHED: "Matched",
  SPLIT_MATCHED: "Split Matched",
  MISMATCH: "Mismatched",
  MULTIPLE_ENTRIES_AMOUNT_MISMATCH: "Multiple Entry Mismatch",
  DUPLICATE_IN_SYSTEM_B: "Duplicate",
  MISSING_IN_SYSTEM_A: "Missing in A",
  MISSING_IN_SYSTEM_B: "Missing in B",
};

function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return Number(value).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status?.replaceAll("_", " ") || "Unknown";
}

function getStatusClass(status) {
  if (status === "MATCHED") return "matched";

  if (status === "SPLIT_MATCHED") return "split-matched";

  if (
    status === "MISMATCH" ||
    status === "MULTIPLE_ENTRIES_AMOUNT_MISMATCH"
  ) {
    return "mismatched";
  }

  if (status === "DUPLICATE_IN_SYSTEM_B") return "duplicate";

  if (
    status === "MISSING_IN_SYSTEM_A" ||
    status === "MISSING_IN_SYSTEM_B"
  ) {
    return "missing";
  }

  return "unknown";
}

function getSystemBEntries(record) {
  if (!record?.system_b) return [];

  return Array.isArray(record.system_b)
    ? record.system_b
    : [record.system_b];
}

function Reconciliation() {
  // Read organization assigned to logged-in user
  const [orgId] = useState(
    () => localStorage.getItem("organization") || ""
  );

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const [selectedRecord, setSelectedRecord] = useState(null);

  // FETCH ORGANIZATION RECONCILIATION DATA
  const fetchRecords = useCallback(async () => {
    if (!orgId) {
      setError("Organization information not found. Please login again.");
      setRecords([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getReconciliation(orgId);

      setSummary(data.summary || {});
      setRecords(data.results || []);

    } catch (err) {
      console.error("Reconciliation API Error:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError("You are not authorized to access this organization.");
      } else {
        setError(
          err.response?.data?.error ||
          "Unable to fetch reconciliation data."
        );
      }

      setRecords([]);
      setSummary(null);

    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // SEARCH AND STATUS FILTER
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const searchText = search.toLowerCase();

      const entries = getSystemBEntries(record);

      const matchesSearch =
        (record.record_id || "").toLowerCase().includes(searchText) ||
        (record.system_b_entry_id || "")
          .toLowerCase()
          .includes(searchText) ||
        entries.some((entry) =>
          (entry.entry_id || "").toLowerCase().includes(searchText)
        );

      const matchesStatus =
        status === "ALL" || record.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, status]);

  // SUMMARY VALUES
  const totalSystemA = summary?.total_system_a_records ?? 0;
  const totalSystemB = summary?.total_system_b_entries ?? 0;
  const matched = summary?.matched ?? 0;
  const splitMatched = summary?.split_matched ?? 0;
  const mismatched = summary?.mismatched ?? 0;

  const multipleEntryMismatches =
    summary?.multiple_entry_mismatches ?? 0;

  const duplicates = summary?.duplicates_in_system_b ?? 0;

  const missing =
    (summary?.missing_in_system_a ?? 0) +
    (summary?.missing_in_system_b ?? 0);

  // CSV EXPORT
  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("No records available to export.");
      return;
    }

    const headers = [
      "Organization",
      "Record ID",
      "System B Entry IDs",
      "System B Entry Count",
      "System A Amount",
      "System B Combined Amount",
      "Amount Difference",
      "System A Date",
      "System B Dates",
      "System A Location",
      "System B Locations",
      "Status",
      "Differences",
    ];

    const safeText = (value) => {
      const text = String(value ?? "");

      return /^[\s]*[=+\-@\t\r]/.test(text)
        ? `'${text}`
        : text;
    };

    const escapeCSV = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredRecords.map((record) => {
      const entries = getSystemBEntries(record);

      const entryIds = entries
        .map((entry) => entry.entry_id)
        .filter(Boolean);

      const entryDates = entries
        .map((entry) => entry.date)
        .filter(Boolean);

      const entryLocations = entries
        .map((entry) => entry.location)
        .filter(Boolean);

      return [
        orgId,
        record.record_id,
        entryIds.join(" | ") || record.system_b_entry_id || "",
        entries.length,
        record.system_a_amount ?? "",
        record.system_b_combined_amount ??
          record.system_b_amount ??
          "",
        record.amount_difference ?? "",
        record.system_a_date ?? "",
        entryDates.join(" | ") || record.system_b_date || "",
        record.system_a_location ?? "",
        entryLocations.join(" | ") || record.system_b_location || "",
        getStatusLabel(record.status),
        (record.differences || []).join(" | "),
      ].map((value, index) => {
        if ([3, 4, 5, 6].includes(index)) {
          return escapeCSV(value);
        }

        return escapeCSV(safeText(value));
      });
    });

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;

    link.download = `DealerOS_${orgId}_Reconciliation_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const closeModal = () => {
    setSelectedRecord(null);
  };

  return (
    <div className="reconciliation-page">

      {/* PAGE HEADER */}
      <div className="reconciliation-header">
        <div>
          <h1>Reconciliation</h1>
          <p>
            Compare transactions between System A and System B.
          </p>
          <p className="organization-info">
            Organization: <strong>{orgId || "Not assigned"}</strong>
          </p>
        </div>

        <div className="header-actions">
          <button
            className="export-button"
            onClick={exportCSV}
            disabled={loading || filteredRecords.length === 0}
          >
            <Download size={17} />
            Export CSV
          </button>

          <button
            className="refresh-button"
            onClick={fetchRecords}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "spin" : ""}
            />

            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="error-message">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="reconciliation-stats">

        <div className="reconciliation-stat-card">
          <div className="stat-info">
            <p>System A Records</p>
            <h2>{loading ? "..." : totalSystemA}</h2>
          </div>
          <div className="stat-icon blue">
            <Database size={23} />
          </div>
        </div>

        <div className="reconciliation-stat-card">
          <div className="stat-info">
            <p>System B Entries</p>
            <h2>{loading ? "..." : totalSystemB}</h2>
          </div>
          <div className="stat-icon purple">
            <Database size={23} />
          </div>
        </div>

        <div className="reconciliation-stat-card">
          <div className="stat-info">
            <p>Matched</p>
            <h2>{loading ? "..." : matched}</h2>
          </div>
          <div className="stat-icon green">
            <CheckCircle size={23} />
          </div>
        </div>

        <div className="reconciliation-stat-card">
          <div className="stat-info">
            <p>Split Matched</p>
            <h2>{loading ? "..." : splitMatched}</h2>
          </div>
          <div className="stat-icon teal">
            <GitMerge size={23} />
          </div>
        </div>

        <div className="reconciliation-stat-card">
          <div className="stat-info">
            <p>Mismatched</p>
            <h2>{loading ? "..." : mismatched}</h2>
          </div>
          <div className="stat-icon orange">
            <AlertTriangle size={23} />
          </div>
        </div>

        <div className="reconciliation-stat-card">
          <div className="stat-info">
            <p>Multiple Entry Mismatches</p>
            <h2>{loading ? "..." : multipleEntryMismatches}</h2>
          </div>
          <div className="stat-icon orange">
            <Copy size={23} />
          </div>
        </div>

        <div className="reconciliation-stat-card">
          <div className="stat-info">
            <p>Duplicates</p>
            <h2>{loading ? "..." : duplicates}</h2>
          </div>
          <div className="stat-icon red">
            <Copy size={23} />
          </div>
        </div>

        <div className="reconciliation-stat-card">
          <div className="stat-info">
            <p>Missing Records</p>
            <h2>{loading ? "..." : missing}</h2>
          </div>
          <div className="stat-icon red">
            <XCircle size={23} />
          </div>
        </div>

      </div>

      {/* SEARCH AND FILTER */}
      <div className="reconciliation-toolbar">

        <div className="search-box">
          <Search size={19} />

          <input
            type="text"
            placeholder="Search Record ID or Entry ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="status-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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

      {/* TRANSACTION TABLE */}
      <div className="reconciliation-table-container">

        <div className="table-heading">
          <div>
            <h2>Transaction Records</h2>
            <p>Reconciliation results for {orgId}</p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="reconciliation-table">

            <thead>
              <tr>
                <th>Record ID</th>
                <th>System B Entry</th>
                <th>System A Amount</th>
                <th>System B Amount</th>
                <th>System A Date</th>
                <th>System B Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="8" className="empty-table">
                    Loading reconciliation records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  const entries = getSystemBEntries(record);

                  const entryIds = entries
                    .map((entry) => entry.entry_id)
                    .filter(Boolean);

                  const entryText =
                    entryIds.length > 1
                      ? `${entryIds.length} entries`
                      : entryIds[0] ||
                        record.system_b_entry_id ||
                        "—";

                  return (
                    <tr key={`${record.record_id}-${index}`}>

                      <td className="record-id">
                        {record.record_id}
                      </td>

                      <td>{entryText}</td>

                      <td>
                        {formatAmount(record.system_a_amount)}
                      </td>

                      <td>
                        {formatAmount(
                          record.system_b_combined_amount ??
                          record.system_b_amount
                        )}
                      </td>

                      <td>{record.system_a_date || "—"}</td>

                      <td>{record.system_b_date || "—"}</td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            record.status
                          )}`}
                        >
                          {getStatusLabel(record.status)}
                        </span>
                      </td>

                      <td>
                        <button
                          className="view-button"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>
        </div>

        <div className="table-footer">
          Showing {filteredRecords.length} of {records.length} records
        </div>

      </div>

      {/* TRANSACTION DETAILS MODAL */}
      {selectedRecord && (
        <div
          className="modal-overlay"
          onClick={closeModal}
        >
          <div
            className="transaction-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <div>
                <h2>Transaction Details</h2>
                <p>{selectedRecord.record_id}</p>
              </div>

              <button
                className="close-modal"
                onClick={closeModal}
              >
                <X size={23} />
              </button>
            </div>

            <div className="modal-content">

              <div className="detail-row">
                <span>Status</span>
                <strong>
                  {getStatusLabel(selectedRecord.status)}
                </strong>
              </div>

              <div className="detail-row">
                <span>System A Amount</span>
                <strong>
                  {formatAmount(selectedRecord.system_a_amount)}
                </strong>
              </div>

              <div className="detail-row">
                <span>System B Amount</span>
                <strong>
                  {formatAmount(
                    selectedRecord.system_b_combined_amount ??
                    selectedRecord.system_b_amount
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>System A Date</span>
                <strong>
                  {selectedRecord.system_a_date || "—"}
                </strong>
              </div>

              <div className="detail-row">
                <span>System B Date</span>
                <strong>
                  {selectedRecord.system_b_date || "—"}
                </strong>
              </div>

              <div className="detail-row">
                <span>System A Location</span>
                <strong>
                  {selectedRecord.system_a_location || "—"}
                </strong>
              </div>

              <div className="detail-row">
                <span>System B Location</span>
                <strong>
                  {selectedRecord.system_b_location || "—"}
                </strong>
              </div>

              {/* SYSTEM A DETAILS */}
              {selectedRecord.system_a && (
                <div className="modal-section">

                  <h3>System A Details</h3>

                  <div className="detail-row">
                    <span>Record ID</span>
                    <strong>
                      {selectedRecord.system_a.record_id}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Base Value</span>
                    <strong>
                      {formatAmount(
                        selectedRecord.system_a.base_value
                      )}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Adjustment</span>
                    <strong>
                      {formatAmount(
                        selectedRecord.system_a.adjustment
                      )}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Category</span>
                    <strong>
                      {selectedRecord.system_a.category_code || "—"}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Actor</span>
                    <strong>
                      {selectedRecord.system_a.actor_id || "—"}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>State</span>
                    <strong>
                      {selectedRecord.system_a.state || "—"}
                    </strong>
                  </div>

                </div>
              )}

              {/* SYSTEM B DETAILS */}
              {getSystemBEntries(selectedRecord).length > 0 && (
                <div className="modal-section">

                  <h3>
                    {getSystemBEntries(selectedRecord).length > 1
                      ? "System B Multiple Entries"
                      : "System B Details"}
                  </h3>

                  {getSystemBEntries(selectedRecord).map(
                    (entry, index) => (
                      <div
                        className="system-b-entry"
                        key={entry.entry_id || index}
                      >

                        <h4>Entry {index + 1}</h4>

                        <div className="detail-row">
                          <span>Entry ID</span>
                          <strong>{entry.entry_id || "—"}</strong>
                        </div>

                        <div className="detail-row">
                          <span>Reference</span>
                          <strong>{entry.record_ref || "—"}</strong>
                        </div>

                        <div className="detail-row">
                          <span>Amount</span>
                          <strong>{formatAmount(entry.amount)}</strong>
                        </div>

                        <div className="detail-row">
                          <span>Date</span>
                          <strong>{entry.date || "—"}</strong>
                        </div>

                        <div className="detail-row">
                          <span>Location</span>
                          <strong>{entry.location || "—"}</strong>
                        </div>

                        <div className="detail-row">
                          <span>Label</span>
                          <strong>{entry.label || "—"}</strong>
                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

              {/* MULTIPLE ENTRY SUMMARY */}
              {getSystemBEntries(selectedRecord).length > 1 && (
                <div className="modal-section">

                  <h3>Multiple Entry Summary</h3>

                  <div className="detail-row">
                    <span>Number of Entries</span>
                    <strong>
                      {getSystemBEntries(selectedRecord).length}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Combined System B Amount</span>
                    <strong>
                      {formatAmount(
                        selectedRecord.system_b_combined_amount ??
                        getSystemBEntries(selectedRecord).reduce(
                          (total, entry) =>
                            total + Number(entry.amount || 0),
                          0
                        )
                      )}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Amount Difference</span>
                    <strong>
                      {formatAmount(
                        selectedRecord.amount_difference ??
                        (
                          Number(selectedRecord.system_a_amount || 0) -
                          getSystemBEntries(selectedRecord).reduce(
                            (total, entry) =>
                              total + Number(entry.amount || 0),
                            0
                          )
                        )
                      )}
                    </strong>
                  </div>

                </div>
              )}

              {/* DIFFERENCES */}
              <div className="modal-section">

                <h3>Differences Found</h3>

                {selectedRecord.differences?.length > 0 ? (
                  <div className="difference-list">

                    {selectedRecord.differences.map(
                      (difference, index) => (
                        <div
                          className="difference-item"
                          key={index}
                        >
                          {difference.replaceAll("_", " ")}
                        </div>
                      )
                    )}

                  </div>
                ) : (
                  <p className="no-differences">
                    No differences found. Transaction is reconciled.
                  </p>
                )}

              </div>

            </div>

            <div className="modal-footer">
              <button onClick={closeModal}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Reconciliation;