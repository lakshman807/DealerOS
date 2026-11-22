import {
    LayoutDashboard,
    GitCompareArrows,
    FileText,
    Settings,
    Building2,
    ChevronRight,
    LogOut
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";


function Sidebar() {

    const navigate = useNavigate();

    // Logout functionality
    const handleLogout = () => {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("username");
        localStorage.removeItem("organization");

        navigate("/login", { replace: true });
    };


    return (

        <aside className="sidebar">

            {/* LOGO */}
            <div className="logo">
                <Building2 size={28} />
                <h2>DealerOS</h2>
            </div>


            {/* MAIN MENU */}
            <p className="menu-title">MAIN MENU</p>

            <nav>

                {/* DASHBOARD */}
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>


                {/* RECONCILIATION */}
                <NavLink
                    to="/reconciliation"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <GitCompareArrows size={20} />
                    <span>Reconciliation</span>
                    <ChevronRight size={16} />
                </NavLink>


                {/* REPORTS */}
                <NavLink
                    to="/reports"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <FileText size={20} />
                    <span>Reports</span>
                </NavLink>

            </nav>


            {/* SIDEBAR BOTTOM */}
            <div className="sidebar-bottom">

                {/* SETTINGS */}
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                    }
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>


                {/* LOGOUT */}
                <button
                    className="nav-item logout-button"
                    onClick={handleLogout}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>

            </div>

        </aside>

    );
}

export default Sidebar;