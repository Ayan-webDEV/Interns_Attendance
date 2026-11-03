import { Activity, Bell, ClipboardCheck, Gift, LayoutDashboard, MoreHorizontal, Users, Wallet } from "lucide-react";
import styles from "./AdminMobileNavigation.module.css";

const ITEMS = [
  {id:"overview",label:"Home",Icon:LayoutDashboard},
  {id:"groups",label:"Groups",Icon:Users},
  {id:"interns",label:"Interns",Icon:Activity},
  {id:"approvals",label:"Approvals",Icon:ClipboardCheck},
  {id:"wallet",label:"Wallet",Icon:Wallet},
];

export default function AdminMobileNavigation({activeTab,onNavigate,onMore}) {
  return (
    <nav className={styles.dock} aria-label="Quick admin navigation">
      {ITEMS.map(({id,label,Icon})=>(
        <button key={id} type="button" onClick={()=>onNavigate(id)} className={activeTab===id?styles.active: ""} aria-current={activeTab===id?"page":undefined}>
          <Icon size={18}/><span>{label}</span>
        </button>
      ))}
      <button type="button" onClick={onMore}><MoreHorizontal size={19}/><span>More</span></button>
    </nav>
  );
}
