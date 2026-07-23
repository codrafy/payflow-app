import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Menu, LayoutDashboard, Briefcase, Plus, HandCoins, Clock, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Home" },
  { path: "/jobs", icon: Briefcase, label: "Jobs" },
  { path: "/add-pay", icon: Plus, label: "Add Weekly Pay" },
  { path: "/add-payment", icon: HandCoins, label: "Record Payment" },
  { path: "/history", icon: Clock, label: "History" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const PAGE_TITLES = {
  "/": "PayFlow",
  "/add-pay": "Add Weekly Pay",
  "/add-payment": "Record Payment",
  "/add-extra-job": "Add Extra Job",
  "/history": "History",
  "/statement": "Statement",
  "/settings": "Settings",
  "/jobs": "Jobs",
};

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";
  const isJobDetail = location.pathname.startsWith("/jobs/") && location.pathname !== "/jobs";

  let title = PAGE_TITLES[location.pathname] ?? "PayFlow";
  if (isJobDetail) title = "Job Details";

  const handleBack = () => navigate(-1);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto relative">
        {/* Left: menu or back */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
                <DropdownMenuItem key={path} asChild>
                  <Link to={path} className="flex items-center gap-3 cursor-pointer">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span>{label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {!isHome && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        <span className="absolute left-0 right-0 text-center text-base font-bold text-foreground pointer-events-none">
          {title}
        </span>
      </div>
    </header>
  );
}
