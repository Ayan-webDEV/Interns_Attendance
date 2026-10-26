import { Gift } from "lucide-react";
import { Field } from "../../../components/ui/Primitives.jsx";

export default function PromosPage({
  groups,
  promoForm,
  setPromoForm,
  createPromo,
  codes,
  expirePromo,
  notify,
  fmtDate,
}) {
  const updateField = (key, value) => {
    setPromoForm((current) => ({ ...current, [key]: value }));
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      notify("Promo code copied.");
    } catch {
      notify("Unable to copy the promo code. Please copy it manually.");
    }
  };

  return (
    <div className="space-y-5">
      <header className="page-heading">
        <div>
          <div className="eyebrow">REWARD CAMPAIGNS</div>
          <h1>Promo codes</h1>
          <p>
            Group-specific rewards with limits. You can expire any code
            immediately.
          </p>
        </div>
      </header>

      <section className="panel min-w-0">
        <div className="panel-header flex items-center justify-between gap-3">
          <div>
            <h2>Create a promo code</h2>
            <p>Rewards are credited as InternCash only.</p>
          </div>
          <Gift size={20} className="shrink-0" />
        </div>

        <form onSubmit={createPromo} className="space-y-4">
          <Field label="Target group">
            <select
              className="select w-full"
              required
              value={promoForm.groupId}
              onChange={(event) => updateField("groupId", event.target.value)}
            >
              <option value="">Choose a group</option>
              {groups
                .filter((group) => group.status !== "completed")
                .map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Minimum reward (IC)">
              <input
                className="input w-full"
                type="number"
                min="1"
                required
                value={promoForm.minReward}
                onChange={(event) =>
                  updateField("minReward", Number(event.target.value))
                }
              />
            </Field>

            <Field label="Maximum reward (IC)">
              <input
                className="input w-full"
                type="number"
                min={promoForm.minReward}
                required
                value={promoForm.maxReward}
                onChange={(event) =>
                  updateField("maxReward", Number(event.target.value))
                }
              />
            </Field>

            <Field label="Redemption cap">
              <input
                className="input w-full"
                type="number"
                min="1"
                required
                value={promoForm.maxRedemptions}
                onChange={(event) =>
                  updateField("maxRedemptions", Number(event.target.value))
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Custom code (optional)">
              <input
                className="input w-full"
                value={promoForm.code}
                onChange={(event) =>
                  updateField("code", event.target.value.toUpperCase())
                }
                placeholder="WELCOME-COHORT"
              />
            </Field>

            <Field label="Expiry date (optional)">
              <input
                className="input w-full"
                type="datetime-local"
                value={
                  promoForm.expiresAt
                    ? toDateTimeLocal(promoForm.expiresAt)
                    : ""
                }
                onChange={(event) =>
                  updateField(
                    "expiresAt",
                    event.target.value
                      ? new Date(event.target.value).toISOString()
                      : "",
                  )
                }
              />
            </Field>
          </div>

          <button type="submit" className="btn btn-primary">
            <Gift size={15} />
            Create promo code
          </button>
        </form>
      </section>

      <section className="panel min-w-0">
        <div className="panel-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2>Created promo codes</h2>
            <p>Expired codes cannot be redeemed.</p>
          </div>
          <span className="badge">{codes.length} total</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Group</th>
                <th>Reward range</th>
                <th>Redemptions</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {codes.map((code) => (
                <tr key={code._id}>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{code.code}</b>
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => copyCode(code.code)}
                      >
                        Copy
                      </button>
                    </div>
                  </td>

                  <td>{code.group?.name || "—"}</td>

                  <td>
                    {code.minReward}–{code.maxReward} IC
                  </td>

                  <td>
                    {code.redemptionCount}/{code.maxRedemptions}
                  </td>

                  <td>{fmtDate(code.expiresAt)}</td>

                  <td>
                    <span
                      className={`badge ${
                        code.active ? "badge-green" : "badge-red"
                      }`}
                    >
                      {code.active ? "Active" : "Expired / closed"}
                    </span>
                  </td>

                  <td>
                    {code.active && (
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() => expirePromo(code)}
                      >
                        Expire now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!codes.length && (
            <div className="empty">No promo codes created.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function toDateTimeLocal(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}
