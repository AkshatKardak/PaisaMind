import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Layout() {
  return (
    <div className="app-shell relative min-h-screen bg-transparent text-[var(--text-primary)]">
      <div className="relative z-10 flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col px-4 py-4 md:px-6 md:py-5">
          <Navbar />
          <main className="pm-page relative z-10 flex-1 pb-24 md:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;