export const getStored = () => { try { return JSON.parse(localStorage.getItem('vloop-attendance-session') || 'null'); } catch { return null; } };
export const saveStored = (value) => { if (value) localStorage.setItem('vloop-attendance-session', JSON.stringify(value)); else localStorage.removeItem('vloop-attendance-session'); };
export const dateToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const money = (value) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
