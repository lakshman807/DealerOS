import { Bell, Search, Building2, UserCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

function Header() {

    const location = useLocation();

    // Get logged-in user details
    const username = localStorage.getItem("username") || "User";
    const orgId = localStorage.getItem("organization") || "Organization";

    // Page title
    const pageTitle =
        location.pathname === "/reconciliation"
            ? "Reconciliation"
            : location.pathname === "/reports"
            ? "Reports & Analytics"
            : location.pathname === "/settings"
            ? "Settings"
            : "Dashboard";

    return (

        <header className="header">

            {/* LEFT SECTION */}
            <div className="header-title">
                <h2>{pageTitle}</h2>

                <p>
                    Welcome back, {username}! Here's your reconciliation overview.
                </p>
            </div>


            {/* RIGHT SECTION */}
            <div className="header-right">

                {/* SEARCH */}
                <div className="search-box">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search..."
                    />
                </div>


                {/* NOTIFICATION */}
                <button
                    className="notification-button"
                    title="Notifications"
                >
                    <Bell size={21} />
                </button>


                {/* ORGANIZATION DETAILS */}
                <div className="header-user-info">

                    <Building2 size={18} />

                    <span>{orgId}</span>

                </div>


                {/* USER DETAILS */}
                <div className="header-user-info">

                    <UserCircle size={20} />

                    <span>{username}</span>

                </div>

            </div>

        </header>

    );
}

export default Header;