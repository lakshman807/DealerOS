import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
    Database,
    CheckCircle,
    AlertTriangle,
    XCircle,
    RefreshCw
} from "lucide-react";

import { getReconciliation } from "../api/api";
import StatCard from "../components/StatCard";


function Dashboard() {

    const navigate = useNavigate();

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const orgId = localStorage.getItem("organization");


    const fetchDashboardData = useCallback(async () => {

        try {

            setLoading(true);
            setError("");

            const token = localStorage.getItem("access");

            if (!token || !orgId) {
                navigate("/login", { replace: true });
                return;
            }

            const data = await getReconciliation(orgId);

            setSummary(data.summary);

        } catch (err) {

            console.error("Dashboard API Error:", err);

            const statusCode = err.response?.status;

            if (statusCode === 401) {

                localStorage.clear();
                navigate("/login", { replace: true });
                return;

            }

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Unable to load dashboard data."
            );

            setSummary(null);

        } finally {

            setLoading(false);

        }

    }, [orgId, navigate]);


    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);


    const totalRecords =
        summary?.total_system_a_records ?? 0;

    const matched =
        summary?.matched ?? 0;

    const mismatched =
        summary?.mismatched ?? 0;

    const missing =
        (summary?.missing_in_system_a ?? 0) +
        (summary?.missing_in_system_b ?? 0);


    return (

        <div className="dashboard">

            <div className="dashboard-heading">

                <div>
                    <h1>Dashboard</h1>
                    <p>Monitor your reconciliation performance.</p>
                    <p>
                        <strong>Organization:</strong> {orgId}
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchDashboardData}
                    disabled={loading}
                >
                    <RefreshCw size={18} />
                    {loading ? "Loading..." : "Refresh"}
                </button>

            </div>


            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}


            <div className="stats-grid">

                <StatCard
                    title="Total Records"
                    value={loading ? "..." : totalRecords}
                    color="#dbeafe"
                    icon={<Database color="#2563eb" />}
                />

                <StatCard
                    title="Matched"
                    value={loading ? "..." : matched}
                    color="#dcfce7"
                    icon={<CheckCircle color="#16a34a" />}
                />

                <StatCard
                    title="Mismatched"
                    value={loading ? "..." : mismatched}
                    color="#fef3c7"
                    icon={<AlertTriangle color="#d97706" />}
                />

                <StatCard
                    title="Missing"
                    value={loading ? "..." : missing}
                    color="#fee2e2"
                    icon={<XCircle color="#dc2626" />}
                />

            </div>


            <div className="welcome-card">

                <h2>Reconciliation Overview</h2>

                <p>
                    Monitor transactions between System A and System B.
                </p>

                {summary && (
                    <div className="overview-details">

                        <p>
                            <strong>Organization:</strong> {orgId}
                        </p>

                        <p>
                            <strong>System A Records:</strong>{" "}
                            {summary.total_system_a_records}
                        </p>

                        <p>
                            <strong>System B Entries:</strong>{" "}
                            {summary.total_system_b_entries}
                        </p>

                        <p>
                            <strong>Matched:</strong> {summary.matched}
                        </p>

                        <p>
                            <strong>Mismatched:</strong> {summary.mismatched}
                        </p>

                        <p>
                            <strong>Total Results:</strong> {summary.total_results}
                        </p>

                    </div>
                )}

            </div>

        </div>

    );

}

export default Dashboard;