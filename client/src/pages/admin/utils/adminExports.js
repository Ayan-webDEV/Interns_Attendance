export function downloadAdminCsv(rows, filename = "VELOop-admin-export.csv") {
  const csv = (rows || []).map((row) => (row || []).map((value) =>
    `"${String(value ?? "").replaceAll('"','""')}"`
  ).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1500);
}
