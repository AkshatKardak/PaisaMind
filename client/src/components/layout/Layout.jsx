import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const titles = {
  "/dashboard": "Dashboard",
  "/income": "Income",
  "/expenses": "Expenses",
  "/invoices": "Invoices",
  "/tax": "Tax Planner",
  "/goals": "Goals",
  "/reports": "Reports",
  "/settings": "Settings",
};

function Layout() {
  const location = useLocation();

  return (
    <div className="app-shell md:flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar title={titles[location.pathname] || "PaisaMind"} />
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
