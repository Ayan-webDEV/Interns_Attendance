import { CalendarClock, Clock3 } from "lucide-react";
import { Field } from "../../../components/ui/Primitives.jsx";

export default function SettingsPage({
  scheduleForm,
  setScheduleForm,
  saveSchedule,
}) {
  const updateField = (key, value) => {
    setScheduleForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-5">
      <header className="page-heading flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">GLOBAL POLICY</div>
          <h1>Attendance timings</h1>
          <p>
            These server-enforced time windows apply to every group and intern.
            Changes take effect immediately after saving.
          </p>
        </div>

        <CalendarClock size={25} color="var(--accent)" className="shrink-0" />
      </header>

      <section className="panel min-w-0">
        <div className="panel-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2>Daily attendance windows (IST)</h2>
            <p>
              Keep the first window before the re-attendance window. Session 2
              requires session 1 approval.
            </p>
          </div>

          <span className="badge">Asia/Kolkata</span>
        </div>

        <form onSubmit={saveSchedule}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First attendance opens">
              <input
                className="input w-full"
                type="time"
                required
                value={scheduleForm.firstStart}
                onChange={(event) =>
                  updateField("firstStart", event.target.value)
                }
              />
            </Field>

            <Field label="First attendance closes">
              <input
                className="input w-full"
                type="time"
                required
                value={scheduleForm.firstEnd}
                onChange={(event) =>
                  updateField("firstEnd", event.target.value)
                }
              />
            </Field>

            <Field label="Re-attendance opens">
              <input
                className="input w-full"
                type="time"
                required
                value={scheduleForm.secondStart}
                onChange={(event) =>
                  updateField("secondStart", event.target.value)
                }
              />
            </Field>

            <Field label="Re-attendance closes">
              <input
                className="input w-full"
                type="time"
                required
                value={scheduleForm.secondEnd}
                onChange={(event) =>
                  updateField("secondEnd", event.target.value)
                }
              />
            </Field>

            <Field label="Minimum wait before submitting (seconds)">
              <input
                className="input w-full"
                type="number"
                min="10"
                max="600"
                required
                value={scheduleForm.minimumSeconds}
                onChange={(event) =>
                  updateField("minimumSeconds", event.target.value)
                }
              />
            </Field>
          </div>

          <div className="notice my-4">
            First attendance earns 1 InternCash after approval. Re-attendance
            earns 3 InternCash after approval and is blocked until the first
            attendance is approved. Sundays and dates outside the group's
            internship period remain locked.
          </div>

          <button type="submit" className="btn btn-primary">
            <Clock3 size={15} />
            Save timings for everyone
          </button>
        </form>
      </section>
    </div>
  );
}
