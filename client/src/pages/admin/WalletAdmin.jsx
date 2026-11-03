import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, CircleDollarSign, Clock3, RefreshCw,
  Search, SlidersHorizontal, Wallet, UserRound, X, PlusCircle, MinusCircle,
} from "lucide-react";
import { api } from "../../lib/api.js";
import { Field } from "../../components/ui/Primitives.jsx";
import AdminPageHeader from "./components/AdminPageHeader.jsx";
import AdminStatCard from "./components/AdminStatCard.jsx";
import FullscreenModal from "./components/FullscreenModal.jsx";
import { AdminPageSkeleton } from "./components/AdminSkeletons.jsx";
import styles from "./WalletAdmin.module.css";

const sameIntern = (transaction, intern) =>
  String(transaction?.intern?._id || "") === String(intern?._id || "") ||
  String(transaction?.intern?.internId || "") === String(intern?.internId || "");

export default function WalletAdmin({ session, groups = [], interns = [], notify, onAdjusted }) {
  const [transactions,setTransactions] = useState([]);
  const [query,setQuery] = useState("");
  const [groupId,setGroupId] = useState("");
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [expandedIntern,setExpandedIntern] = useState("");
  const [adjustIntern,setAdjustIntern] = useState(null);
  const [adjustForm,setAdjustForm] = useState({direction:"credit",amount:"",reason:""});
  const [adjusting,setAdjusting] = useState(false);

  const refresh = useCallback(async(silent=false)=>{
    silent?setRefreshing(true):setLoading(true);
    try {
      const params = new URLSearchParams();
      if(groupId) params.set("groupId",groupId);
      const d = await api(`/wallet/admin/transactions${params.toString()?`?${params}`:""}`,{token:session.token});
      setTransactions(d.transactions||[]);
    } catch(e) {
      notify?.(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  },[session.token,groupId,notify]);

  useEffect(()=>{refresh();},[refresh]);

  const visibleInterns = useMemo(()=>{
    const q=query.trim().toLowerCase();
    return interns.filter((intern)=>{
      const matchesGroup=!groupId || String(intern.group?._id || intern.groupId || "")===String(groupId);
      const matchesText=!q || [intern.name,intern.email,intern.internId,intern.whatsappNumber,intern.group?.name].some((value)=>String(value||"").toLowerCase().includes(q));
      return matchesGroup && matchesText;
    });
  },[interns,groupId,query]);

  const filteredTransactions = useMemo(()=>{
    const q=query.trim().toLowerCase();
    return transactions.filter((t)=>{
      const sameGroup=!groupId || String(t.group?._id || t.groupId || t.intern?.group?._id || "")===String(groupId);
      const sameQuery=!q || [t.intern?.name,t.intern?.email,t.intern?.internId,t.description,t.type,t.group?.name].some((v)=>String(v||"").toLowerCase().includes(q));
      return sameGroup && sameQuery;
    });
  },[transactions,groupId,query]);

  const credits=filteredTransactions.filter((t)=>Number(t.amount)>0).reduce((s,t)=>s+Number(t.amount),0);
  const debits=filteredTransactions.filter((t)=>Number(t.amount)<0).reduce((s,t)=>s+Math.abs(Number(t.amount)),0);

  const submitAdjustment = async(event)=>{
    event.preventDefault();
    if(!adjustIntern) return;
    const amount=Number(adjustForm.amount);
    if(!Number.isFinite(amount)||amount<=0){notify?.("Enter an adjustment amount greater than zero.");return;}
    if(!adjustForm.reason.trim()){notify?.("Add a reason for the balance adjustment.");return;}
    setAdjusting(true);
    try {
      await api("/wallet/admin/adjust",{
        token:session.token,
        method:"POST",
        body:JSON.stringify({
          internId:adjustIntern.internId,
          amount,
          direction:adjustForm.direction,
          reason:adjustForm.reason.trim(),
        }),
      });
      notify?.(`Balance ${adjustForm.direction==="credit"?"credited to":"debited from"} ${adjustIntern.name}.`);
      setAdjustIntern(null);
      setAdjustForm({direction:"credit",amount:"",reason:""});
      await refresh(true);
      onAdjusted?.();
    } catch(error) {
      const message=error.message || "Balance adjustment failed.";
      notify?.(message.includes("404") ? "The admin balance-adjustment API is not installed on the backend yet. See BACKEND_INTEGRATION.md." : message);
    } finally {
      setAdjusting(false);
    }
  };

  if(loading) return <AdminPageSkeleton variant="wallet"/>;

  return (
    <div className={`${styles.page} admin-page space-y-6`}>
      <AdminPageHeader
        eyebrow="INTERN CASH · FINANCIAL CONTROL"
        title="InternCash ledger"
        description="Review each intern's wallet balance and transaction trail, grouped by cohort."
        icon={Wallet}
        accent="green"
        actions={<button type="button" className="btn btn-secondary inline-flex items-center gap-2" onClick={()=>refresh(true)} disabled={refreshing}><RefreshCw size={15} className={refreshing?"animate-spin":""}/> Refresh ledger</button>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <AdminStatCard label="Credit volume" value={`${credits.toLocaleString("en-IN")} IC`} hint="Visible filtered transactions" icon={ArrowDownLeft} tone="green"/>
        <AdminStatCard label="Debit volume" value={`${debits.toLocaleString("en-IN")} IC`} hint="Visible filtered transactions" icon={ArrowUpRight} tone="red"/>
        <AdminStatCard label="Transactions" value={filteredTransactions.length} hint="Matching ledger records" icon={CircleDollarSign} tone="purple"/>
        <AdminStatCard label="Interns in view" value={visibleInterns.length} hint="Filtered by selected cohort" icon={UserRound} tone="cyan"/>
      </div>

      <section className={styles.filterPanel}>
        <div className={styles.filterIntro}><span><SlidersHorizontal size={18}/></span><div><h2>Ledger filters</h2><p>Choose a group and find an intern by name, email or ID.</p></div></div>
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Search intern / transaction">
            <div className={styles.search}><Search size={16}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Name, intern ID, transaction reason…"/></div>
          </Field>
          <Field label="Select internship group">
            <select className="select w-full" value={groupId} onChange={(e)=>{setGroupId(e.target.value);setExpandedIntern("");}}><option value="">All groups</option>{groups.map((g)=><option key={g._id} value={g._id}>{g.name}</option>)}</select>
          </Field>
        </div>
      </section>

      <section className={styles.internSection}>
        <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>GROUP WALLET DIRECTORY</p><h2>Intern balances <span>{visibleInterns.length}</span></h2><p>Select an intern to view the full wallet ledger.</p></div><span className={styles.txCount}>{filteredTransactions.length} transactions</span></div>

        {visibleInterns.length ? (
          <div className={styles.internList}>
            {visibleInterns.map((intern)=>{
              const internTransactions=filteredTransactions.filter((t)=>sameIntern(t,intern));
              const isExpanded=expandedIntern===intern._id;
              return (
                <article className={styles.internCard} key={intern._id}>
                  <div className={styles.internTop}>
                    <div className={styles.avatar}>{(intern.name||"I").trim().charAt(0).toUpperCase()}</div>
                    <div className="min-w-0 flex-1"><h3>{intern.name||"Unnamed intern"}</h3><p>{intern.internId||"No intern ID"} · {intern.group?.name||"Unassigned"}</p><small>{intern.email||"No email"}</small></div>
                    <div className={styles.balance}><span>Current balance</span><strong>{Number(intern.internCashBalance||0).toLocaleString("en-IN")} <small>IC</small></strong></div>
                  </div>
                  <div className={styles.internFooter}>
                    <div className={styles.transactionMeta}><span><Clock3 size={14}/>{internTransactions.length} transactions</span><span>{intern.whatsappNumber||"WhatsApp unavailable"}</span></div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn btn-secondary btn-small" onClick={()=>setExpandedIntern(isExpanded?"":intern._id)}>{isExpanded?"Hide ledger":"View transactions"}</button>
                      <button type="button" className="btn btn-primary btn-small" onClick={()=>{setAdjustIntern(intern);setAdjustForm({direction:"credit",amount:"",reason:""});}}><SlidersHorizontal size={13}/> Adjust balance</button>
                    </div>
                  </div>
                  {isExpanded ? (
                    <div className={styles.transactionList}>
                      {internTransactions.length ? internTransactions.map((t)=>(
                        <div className={styles.transactionRow} key={t._id}>
                          <div className={styles.transactionIcon}>{Number(t.amount)>=0?<PlusCircle size={16}/>:<MinusCircle size={16}/>}</div>
                          <div className="min-w-0 flex-1"><strong>{String(t.type||"transaction").replaceAll("_"," ")}</strong><span>{t.description||"No description"} · {t.createdAt?new Date(t.createdAt).toLocaleString("en-IN"):"Date unavailable"}</span></div>
                          <div className={`${styles.amount} ${Number(t.amount)<0?styles.debit:styles.credit}`}>{Number(t.amount)>0?"+":""}{t.amount} IC<small>Balance: {t.balanceAfter??"—"} IC</small></div>
                        </div>
                      )) : <div className={styles.noTransactions}>No transaction records found for this intern.</div>}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : <div className="empty">No interns match this group and search.</div>}
      </section>

      <section className={styles.allTransactions}>
        <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>AUDIT TRAIL</p><h2>All matching transactions</h2><p>Chronological transaction records across the selected group.</p></div></div>
        <div className={styles.transactionList}>
          {filteredTransactions.slice(0,100).map((t)=>(
            <div className={styles.transactionRow} key={t._id}>
              <div className={styles.transactionIcon}>{Number(t.amount)>=0?<PlusCircle size={16}/>:<MinusCircle size={16}/>}</div>
              <div className="min-w-0 flex-1"><strong>{t.intern?.name||"Deleted / archived intern"} · {t.intern?.internId||t.intern?.email||"—"}</strong><span>{t.description||String(t.type||"transaction").replaceAll("_"," ")} · {t.group?.name||t.intern?.group?.name||"No group"}</span></div>
              <div className={`${styles.amount} ${Number(t.amount)<0?styles.debit:styles.credit}`}>{Number(t.amount)>0?"+":""}{t.amount} IC<small>{t.createdAt?new Date(t.createdAt).toLocaleDateString("en-IN"):"—"}</small></div>
            </div>
          ))}
          {!filteredTransactions.length ? <div className={styles.noTransactions}>No wallet transactions match these filters.</div> : null}
          {filteredTransactions.length>100 ? <p className={styles.showLimit}>Showing latest 100 matching entries. Narrow your filters to inspect a smaller set.</p> : null}
        </div>
      </section>

      <FullscreenModal
        open={Boolean(adjustIntern)}
        title={adjustIntern ? `Adjust ${adjustIntern.name}'s balance` : "Adjust intern balance"}
        description={adjustIntern ? `${adjustIntern.internId} · ${adjustIntern.group?.name||"Unassigned group"}` : ""}
        size="small"
        onClose={()=>!adjusting&&setAdjustIntern(null)}
      >
        {adjustIntern ? (
          <form onSubmit={submitAdjustment} className="space-y-4">
            <div className={styles.balanceSummary}><span>Current InternCash balance</span><strong>{Number(adjustIntern.internCashBalance||0).toLocaleString("en-IN")} IC</strong></div>
            <Field label="Adjustment type">
              <select className="select w-full" value={adjustForm.direction} onChange={(e)=>setAdjustForm((f)=>({...f,direction:e.target.value}))}><option value="credit">Credit · Add InternCash</option><option value="debit">Debit · Deduct InternCash</option></select>
            </Field>
            <Field label="Amount (IC)"><input className="input w-full" type="number" min="1" step="1" required value={adjustForm.amount} onChange={(e)=>setAdjustForm((f)=>({...f,amount:e.target.value}))} placeholder="Enter amount"/></Field>
            <Field label="Reason (required)"><textarea className="textarea w-full" required minLength={5} maxLength={240} rows={3} value={adjustForm.reason} onChange={(e)=>setAdjustForm((f)=>({...f,reason:e.target.value}))} placeholder="Explain why this manual balance adjustment is needed…"/></Field>
            <p className={styles.auditNotice}>This action should create an auditable wallet transaction and must be authorized by the backend.</p>
            <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={()=>setAdjustIntern(null)} disabled={adjusting}>Cancel</button><button type="submit" className="btn btn-primary" disabled={adjusting}>{adjusting?"Saving…":"Confirm adjustment"}</button></div>
          </form>
        ) : null}
      </FullscreenModal>
    </div>
  );
}
