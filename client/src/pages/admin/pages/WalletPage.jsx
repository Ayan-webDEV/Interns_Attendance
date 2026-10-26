import WalletAdmin from "../WalletAdmin.jsx";

export default function WalletPage({ session, groups, notify }) {
  return (
    <div className="min-w-0 space-y-5">
      <header className="page-heading">
        <div>
          <div className="eyebrow">INTERN CASH</div>
          <h1>InternCash ledger</h1>
          <p>
            Review and manage intern wallet records using the existing wallet
            administration tools.
          </p>
        </div>
      </header>

      <section className="min-w-0">
        <WalletAdmin session={session} groups={groups} notify={notify} />
      </section>
    </div>
  );
}
