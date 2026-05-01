import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Search, Mail, Map } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Report Generator", icon: FileText },
  { href: "/dashboard/research", label: "Research Summariser", icon: Search },
  { href: "/dashboard/emails", label: "Email Drafter", icon: Mail },
  { href: "/dashboard/soa-australia", label: "Australian SOA", icon: Map },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="dashboard-nav">
      <div className="nav-group">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx("nav-item", isActive && "active")}
            >
              <Icon className="icon" size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
