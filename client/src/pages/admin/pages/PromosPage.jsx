import { useMemo } from "react";
import { Copy, Gift, RefreshCw, ShieldCheck, TicketPercent, TrendingUp, Users } from "lucide-react";
import { Field } from "../../../components/ui/Primitives.jsx";
import AdminPageHeader from "../components/AdminPageHeader.jsx";
import AdminStatCard from "../components/AdminStatCard.jsx";
import styles from "./PromosPage.module.css";

function toDateTimeLocal(value) {
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) return "";
  const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
}

export default function PromosPage({groups=[],promoForm,setPromoForm,createPromo,codes=[],expirePromo,notify,fmtDate}) {
  const update=(key,value)=>setPromoForm((current)=>({...current,[key]:value}));
  const active=codes.filter((code)=>code.active).length;
  const redemptions=codes.reduce((sum,code)=>sum+Number(code.redemptionCount||0),0);
  const copyCode=async(code)=>{
    try {await navigator.clipboard.writeText(code);notify("Promo code copied.")}
    catch {notify("Unable to copy the promo code. Please copy it manually.")}
  };
  const remainingGroups=useMemo(()=>groups.filter((g)=>g.status!=="completed"),[groups]);

  return (
    <div className={`${styles.page} admin-page space-y-6`}>
      <AdminPageHeader eyebrow="REWARD CAMPAIGNS" title="Promo codes" description="Create cohort-specific reward codes, monitor redemption limits and close campaigns when needed." icon={Gift} accent="purple"/>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <AdminStatCard label="All promo codes" value={codes.length} hint="Created campaigns" icon={TicketPercent} tone="purple"/>
        <AdminStatCard label="Active codes" value={active} hint="Currently available" icon={ShieldCheck} tone="green"/>
        <AdminStatCard label="Total redemptions" value={redemptions} hint="Across all loaded codes" icon={TrendingUp} tone="cyan"/>
      </div>

      <section className={styles.createPanel}>
        <div className={styles.formHeading}>
          <span><Gift size={21}/></span>
          <div><p className={styles.eyebrow}>NEW CAMPAIGN</p><h2>Create a promo code</h2><p>Set reward range, usage cap and the group that can redeem it.</p></div>
        </div>
        <form onSubmit={createPromo} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field label="Target group">
              <select className="select w-full" required value={promoForm.groupId} onChange={(e)=>update("groupId",e.target.value)}>
                <option value="">Choose a group</option>{remainingGroups.map((group)=><option value={group._id} key={group._id}>{group.name}</option>)}
              </select>
            </Field>
            <Field label="Custom code (optional)">
              <input className="input w-full uppercase" value={promoForm.code} onChange={(e)=>update("code",e.target.value.toUpperCase().replace(/\s+/g,"-"))} placeholder="WELCOME-COHORT"/>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Minimum reward (IC)"><input className="input w-full" type="number" min="1" required value={promoForm.minReward} onChange={(e)=>update("minReward",Number(e.target.value))}/></Field>
            <Field label="Maximum reward (IC)"><input className="input w-full" type="number" min={promoForm.minReward} required value={promoForm.maxReward} onChange={(e)=>update("maxReward",Number(e.target.value))}/></Field>
            <Field label="Redemption cap"><input className="input w-full" type="number" min="1" required value={promoForm.maxRedemptions} onChange={(e)=>update("maxRedemptions",Number(e.target.value))}/></Field>
          </div>
          <Field label="Expiry date (optional)">
            <input className="input w-full" type="datetime-local" value={promoForm.expiresAt?toDateTimeLocal(promoForm.expiresAt):""} onChange={(e)=>update("expiresAt",e.target.value?new Date(e.target.value).toISOString():"")}/>
          </Field>
          <div className={styles.formFooter}>
            <p><Users size={15}/> Rewards are issued as InternCash after a successful redemption.</p>
            <button type="submit" className="btn btn-primary inline-flex items-center justify-center gap-2"><Gift size={15}/> Create promo code</button>
          </div>
        </form>
      </section>

      <section className={styles.historyPanel}>
        <div className={styles.historyHeader}>
          <div><p className={styles.eyebrow}>CAMPAIGN HISTORY</p><h2>Created promo codes <span>{codes.length}</span></h2><p>Copy codes or expire active campaigns. Expired codes cannot be redeemed.</p></div>
        </div>
        {codes.length ? (
          <div className={styles.codeList}>
            {codes.map((code)=>(
              <article className={styles.codeCard} key={code._id}>
                <div className={styles.codeIdentity}>
                  <span className={styles.ticketIcon}><TicketPercent size={19}/></span>
                  <div className="min-w-0"><strong>{code.code}</strong><small>{code.group?.name||"All / unassigned group"}</small></div>
                  <span className={`${styles.status} ${code.active?styles.active:styles.closed}`}>{code.active?"Active":"Expired / closed"}</span>
                </div>
                <div className={styles.codeMeta}>
                  <div><span>Reward range</span><b>{code.minReward}–{code.maxReward} IC</b></div>
                  <div><span>Redemptions</span><b>{code.redemptionCount||0}/{code.maxRedemptions||"—"}</b></div>
                  <div><span>Expires</span><b>{fmtDate(code.expiresAt)}</b></div>
                </div>
                <div className={styles.codeActions}>
                  <button type="button" className="btn btn-secondary btn-small" onClick={()=>copyCode(code.code)}><Copy size={13}/> Copy code</button>
                  {code.active?<button type="button" className="btn btn-danger btn-small" onClick={()=>expirePromo(code)}><RefreshCw size={13}/> Expire now</button>:null}
                </div>
              </article>
            ))}
          </div>
        ) : <div className="empty">No promo codes created yet. Your campaigns will appear here.</div>}
      </section>
    </div>
  );
}
