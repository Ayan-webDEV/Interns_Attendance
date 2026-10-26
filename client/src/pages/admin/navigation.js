import {
  Activity,
  Bell,
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Gift,
  LayoutDashboard,
  Wallet,
  Users,
} from "lucide-react";

export const NAV_ITEMS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "groups", label: "Groups & invites", Icon: Users },
  { id: "interns", label: "Intern directory", Icon: ClipboardList },
  { id: "approvals", label: "Attendance approvals", Icon: ClipboardCheck },
  { id: "attendance", label: "Attendance reports", Icon: CalendarCheck },
  { id: "wallet", label: "InternCash ledger", Icon: Wallet },
  { id: "promos", label: "Promo codes", Icon: Gift },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "settings", label: "Attendance timings", Icon: CalendarClock },
];

export const ADMIN_TAB_IDS = NAV_ITEMS.map((item) => item.id);

export const DEFAULT_ADMIN_TAB = "overview";
