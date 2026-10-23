import { Bell, Moon, Sun, PanelLeft, User, LogOut } from "lucide-react";
import "./Style/Navbar.css";
import { useContext } from "react";
import { AuthContext } from "../Context/AuthContextValue";
import { useNavigate, useLocation } from "react-router-dom";

type NavbarProps = {
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDark: React.Dispatch<React.SetStateAction<boolean>>;
  setShowNotif: React.Dispatch<React.SetStateAction<boolean>>;
  dark: boolean;
  showNotif: boolean;
  showProfile: boolean;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Navbar = ({
  setSidebarOpen,
  dark,
  setDark,
  showNotif,
  setShowNotif,
  showProfile,
  setShowProfile,
}: NavbarProps) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/playground": "Playground Chat",
    "/dashboard/playground/create-campaign": "Create Campaign",
    "/dashboard/playground/view-campaigns": "View Campaigns",
    "/dashboard/service": "Services",
    "/dashboard/service/add": "Add Service",
    "/dashboard/ai-contexts": "AI Contexts",
    "/dashboard/ai-contexts/add": "Add AI Context",
    "/dashboard/businesses": "Businesses",
    "/dashboard/businesses/add": "Add Business",
    "/dashboard/lead-qualification": "Lead Qualification",
    "/dashboard/lead-qualification/view": "View Lead Qualifications",
    "/dashboard/catalogue": "Catalogue Explorer & Studio",
    "/dashboard/catalogue/niches": "Manage Niches",
    "/dashboard/catalogue/search": "Specification Search",
  };

  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  return (
    <div
      className={`navbar ${dark ? "dark" : ""}`}
      style={{ color: dark ? "white" : "black" }}
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <PanelLeft
          size={18}
          className="cursor-pointer"
          onClick={() => setSidebarOpen((prev) => !prev)}
        />
        <span className="nav-title">{pageTitle}</span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4 extra-margin">
        <button
          onClick={() => setDark((prev) => !prev)}
          className="icon-btn"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="relative">
          <Bell
            size={18}
            className="icon-btn-bell"
            onClick={() => setShowNotif((prev) => !prev)}
          />

          {showNotif && (
            <div className="notif-box">
              <h3 className="font-semibold mb-2">Notifications</h3>
              <p className="text-sm opacity-70">No new notifications</p>
            </div>
          )}
        </div>

        {/* AVATAR */}
        <div
          className="avatar cursor-pointer"
          onClick={() => setShowProfile((prev) => !prev)}
        />

        {/* PROFILE DROPDOWN */}
        {showProfile && (
          <div className="profile-box">
            <div className="profile-item">
              <User size={16} />
              <span>Profile</span>
            </div>

            <div
              className="profile-item"
              onClick={() => {
                auth?.logout();
                navigate("/login");
              }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};