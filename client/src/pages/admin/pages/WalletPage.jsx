import WalletAdmin from "../WalletAdmin.jsx";
import styles from "./WalletPage.module.css";

export default function WalletPage({ session, groups, interns, notify, onAdjusted }) {
  return (
    <div className={`${styles.page} admin-page min-w-0`}>
      <WalletAdmin
        session={session}
        groups={groups}
        interns={interns}
        notify={notify}
        onAdjusted={onAdjusted}
      />
    </div>
  );
}
