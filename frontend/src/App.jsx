import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Reconciliation from "./pages/Reconciliation";
import Reports from "./pages/Reports";
import Login from "./pages/Login";

import "./App.css";


function ProtectedLayout() {

    const token = localStorage.getItem("access");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="app-container">

            <Sidebar />

            <main className="main-content">
                <Header />

                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/reconciliation" element={<Reconciliation />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

            </main>

        </div>
    );
}


function App() {

    return (
        <BrowserRouter>

            <Routes>

                <Route path="/login" element={<Login />} />

                <Route path="/*" element={<ProtectedLayout />} />

            </Routes>

        </BrowserRouter>
    );
}

export default App;