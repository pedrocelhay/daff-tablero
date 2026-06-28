import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://cnmhqrcanhastgvbwyqk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubWhxcmNhbmhhc3RndmJ3eXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzg2MjAsImV4cCI6MjA5NjcxNDYyMH0.2DaDd-_J6T1Fk2q733ncbkAy8jM7TGioTeDIt9J8Yxc";

const sbFetch = async (method, id, body) => {
  const url = `${SUPABASE_URL}/rest/v1/tablero${method === "GET" ? "" : id ? `?id=eq.${id}` : ""}`;
  const res = await fetch(method === "GET" ? `${SUPABASE_URL}/rest/v1/tablero?select=*` : url, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "resolution=merge-duplicates" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (method === "GET") return res.json();
  return res.ok;
};

const LINEAS = [
  { nombre: "Junaeb", emoji: "ðŸ«" },
  { nombre: "Retail", emoji: "ðŸ›’" },
  { nombre: "Food Service", emoji: "ðŸ½ï¸" },
  { nombre: "Mercado PÃºblico", emoji: "ðŸ›ï¸" },
  { nombre: "Remoto", emoji: "ðŸ“¡" },
  { nombre: "Peff (Mascotas)", emoji: "ðŸ¾" },
  { nombre: "Internacional", emoji: "ðŸŒŽ" },
];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const ESTADOS_REUNION = [
  { value: "pendiente", label: "Pendiente", color: "#94a3b8", bg: "#F1F5F9" },
  { value: "realizada", label: "Realizada âœ“", color: "#16a34a", bg: "#F0FDF4" },
  { value: "postergada", label: "Postergada", color: "#d97706", bg: "#FFFBEB" },
  { value: "caida", label: "No se realizÃ³", color: "#dc2626", bg: "#FEF2F2" },
];

const LUGARES = [
  { value: "daff", label: "En Daff", emoji: "ðŸ¢" },
  { value: "cliente", label: "Donde el cliente", emoji: "ðŸ“" },
  { value: "virtual", label: "Virtual", emoji: "ðŸ’»" },
  { value: "otro", label: "Otro", emoji: "ðŸ“Œ" },
];

const newReunion = () => ({ id: Date.now() + Math.random(), cliente: "", asunto: "", lugar: "virtual", lugarCustom: "", estado: "pendiente", resultado: "" });

const TIPOS_CAMPANA = [
  { value: "fidelidad",  label: "Fidelidad",   emoji: "â¤ï¸" },
  { value: "promocion",  label: "PromociÃ³n",    emoji: "ðŸ·ï¸" },
  { value: "catalogo",   label: "CatÃ¡logo",     emoji: "ðŸ“–" },
  { value: "video",      label: "Video",        emoji: "ðŸŽ¬" },
  { value: "lanzamiento",label: "Lanzamiento",  emoji: "ðŸš€" },
  { value: "otra",       label: "Otra",         emoji: "ðŸ“£" },
];

const ESTADOS_CAMPANA = [
  { value: "planificada", label: "Planificada",   color: "#94a3b8", bg: "#F1F5F9" },
  { value: "ejecutada",   label: "Ejecutada âœ“",   color: "#16a34a", bg: "#F0FDF4" },
  { value: "parcial",     label: "Parcial",        color: "#d97706", bg: "#FFFBEB" },
  { value: "no_ejecutada",label: "No ejecutada",   color: "#dc2626", bg: "#FEF2F2" },
];

const emptyLine = () => ({
  responsable: "",
  metaVenta: "", precioPorKilo: "", margen: "",
  reunionesMeta: "", opCerrarMeta: "", nuevosClientesMeta: "",
  cobranzaMeta: "",
  notasCompromiso: "",
  resultadoVenta: "", precioPorKiloReal: "", margenReal: "",
  reunionesReal: "", opCerradas: "", nuevosClientes: "",
  opActivas: "", opPerdidas: "", opNuevas: "",
  cobranzaReal: "",
  notasLogro: "",
  campana: { nombre: "", tipo: "promocion", estado: "planificada" },
  accion: { descripcion: "", estado: "pendiente" },  // acciÃ³n especial del mes (ej: liquidaciÃ³n de stock)
  compromisoFirmado: false,
  logroFirmado: false,
});

const fmt = (v, prefix = "", suffix = "") => {
  if (v === "" || v === undefined) return "â€”";
  const n = parseFloat(v);
  if (isNaN(n)) return "â€”";
  return `${prefix}${n.toLocaleString("es-CL")}${suffix}`;
};

const pct = (real, meta) => {
  const r = parseFloat(real), m = parseFloat(meta);
  if (!r || !m || m === 0) return null;
  return Math.round((r / m) * 100);
};

const semaforo = (p) => {
  if (p === null) return { color: "#94a3b8", bg: "#F1F5F9", label: "Sin datos" };
  if (p >= 100) return { color: "#16a34a", bg: "#DCFCE7", label: "Logrado âœ“" };
  if (p >= 80) return { color: "#d97706", bg: "#FEF3C7", label: "Cerca" };
  return { color: "#dc2626", bg: "#FEE2E2", label: "Brecha" };
};

// SemÃ¡foro invertido: menos real que meta = bueno
const semaforoInverso = (real, meta) => {
  const r = parseFloat(real), m = parseFloat(meta);
  if (isNaN(r) || isNaN(m) || m === 0) return { color: "#94a3b8", bg: "#F1F5F9", label: "Sin datos", pct: null };
  const p = Math.round((r / m) * 100);
  if (r <= m) return { color: "#16a34a", bg: "#DCFCE7", label: "Bajo control âœ“", pct: p };
  if (p <= 130) return { color: "#d97706", bg: "#FEF3C7", label: "AtenciÃ³n", pct: p };
  return { color: "#dc2626", bg: "#FEE2E2", label: "Alerta ðŸš¨", pct: p };
};

const Input = ({ label, value, onChange, prefix = "", suffix = "", type = "number", disabled = false }) => (
  <div>
    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>{label}</label>
    <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E2E8F0", borderRadius: 8, background: disabled ? "#F8FAFC" : "#FAFBFC", overflow: "hidden" }}>
      {prefix && <span style={{ padding: "0 10px", color: "#94a3b8", fontSize: 13, fontWeight: 600, borderRight: "1px solid #E2E8F0" }}>{prefix}</span>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        style={{ flex: 1, border: "none", background: "transparent", padding: "9px 12px", fontSize: 15, color: disabled ? "#94a3b8" : "#1e293b", outline: "none", fontWeight: 500 }} />
      {suffix && <span style={{ padding: "0 10px", color: "#94a3b8", fontSize: 13, borderLeft: "1px solid #E2E8F0" }}>{suffix}</span>}
    </div>
  </div>
);

const Delta = ({ label, meta, real, prefix = "", suffix = "" }) => {
  const p = pct(real, meta);
  const s = semaforo(p);
  const diff = (parseFloat(real) || 0) - (parseFloat(meta) || 0);
  const diffStr = diff !== 0 ? `${diff > 0 ? "+" : ""}${prefix}${Math.abs(diff).toLocaleString("es-CL")}${suffix}` : null;
  return (
    <div style={{ background: s.bg, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "6px 0 2px" }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{fmt(real, prefix, suffix)}</span>
        {p !== null && <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{p}%</span>}
      </div>
      <div style={{ fontSize: 12, color: "#64748b" }}>Meta: <strong>{fmt(meta, prefix, suffix)}</strong>
        {diffStr && <span style={{ marginLeft: 8, color: s.color, fontWeight: 700 }}>{diffStr}</span>}
      </div>
      <div style={{ height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
        <div style={{ height: "100%", width: `${Math.min(p || 0, 100)}%`, background: s.color, borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginTop: 5 }}>{s.label}</div>
    </div>
  );
};

// Cobranza: menos = mejor
const DeltaCobranza = ({ meta, real }) => {
  const s = semaforoInverso(real, meta);
  const r = parseFloat(real), m = parseFloat(meta);
  const diff = !isNaN(r) && !isNaN(m) ? r - m : null;
  const diffStr = diff !== null && diff !== 0
    ? `${diff > 0 ? "+" : ""}${Math.abs(diff)} vs. mÃ¡x`
    : null;
  return (
    <div style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${s.color}22` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        ðŸ’³ Clientes atrasados +10d
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "6px 0 2px" }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{real !== "" && real !== undefined ? real : "â€”"}</span>
        {s.pct !== null && <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>({s.pct}% del mÃ¡x.)</span>}
      </div>
      <div style={{ fontSize: 12, color: "#64748b" }}>
        MÃ¡ximo comprometido: <strong>{meta || "â€”"}</strong>
        {diffStr && <span style={{ marginLeft: 8, color: s.color, fontWeight: 700 }}>{diffStr}</span>}
      </div>
      <div style={{ height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
        <div style={{ height: "100%", width: `${Math.min(s.pct || 0, 100)}%`, background: s.color, borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginTop: 5 }}>{s.label}</div>
    </div>
  );
};

// â”€â”€ Componente de Reuniones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TablaReuniones = ({ reuniones, onChange, modoBalance = false, disabled = false }) => {
  const [nuevaCliente, setNuevaCliente] = useState("");
  const [nuevoAsunto, setNuevoAsunto] = useState("");
  const [nuevoLugar, setNuevoLugar] = useState("virtual");

  const agregar = () => {
    if (!nuevaCliente.trim() && !nuevoAsunto.trim()) return;
    onChange([...reuniones, { ...newReunion(), cliente: nuevaCliente, asunto: nuevoAsunto, lugar: nuevoLugar }]);
    setNuevaCliente("");
    setNuevoAsunto("");
    setNuevoLugar("virtual");
  };

  const actualizar = (id, campo, val) => {
    onChange(reuniones.map(r => r.id === id ? { ...r, [campo]: val } : r));
  };

  const eliminar = (id) => onChange(reuniones.filter(r => r.id !== id));

  const conteo = ESTADOS_REUNION.reduce((acc, e) => {
    acc[e.value] = reuniones.filter(r => r.estado === e.value).length;
    return acc;
  }, {});

  return (
    <div>
      {/* Contador resumen */}
      {reuniones.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {ESTADOS_REUNION.map(e => conteo[e.value] > 0 && (
            <span key={e.value} style={{ background: e.bg, color: e.color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
              {conteo[e.value]} {e.label}
            </span>
          ))}
          <span style={{ color: "#94a3b8", fontSize: 12, padding: "3px 0" }}>â€” {reuniones.length} total</span>
        </div>
      )}

      {/* Lista de reuniones */}
      {reuniones.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "#cbd5e1", fontSize: 13 }}>
          No hay reuniones planificadas aÃºn
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {reuniones.map((r) => {
          const est = ESTADOS_REUNION.find(e => e.value === r.estado);
          return (
            <div key={r.id} style={{ border: `1.5px solid ${est.bg === "#F1F5F9" ? "#E2E8F0" : est.color + "33"}`, borderRadius: 10, padding: "12px 14px", background: est.bg, transition: "all 0.2s" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {/* Cliente + Asunto */}
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1.5fr 120px", gap: 8 }}>
                  {modoBalance ? (
                    <>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cliente</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginTop: 2 }}>{r.cliente || <span style={{ color: "#cbd5e1" }}>â€”</span>}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Asunto</div>
                        <div style={{ fontSize: 14, color: "#1e293b", marginTop: 2 }}>{r.asunto || <span style={{ color: "#cbd5e1" }}>â€”</span>}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Lugar</div>
                        <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                          {(() => { const l = LUGARES.find(x => x.value === r.lugar); return l ? `${l.emoji} ${r.lugar === "otro" && r.lugarCustom ? r.lugarCustom : l.label}` : "â€”"; })()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <input value={r.cliente} onChange={e => actualizar(r.id, "cliente", e.target.value)}
                        placeholder="Cliente / empresa" disabled={disabled}
                        style={{ border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "7px 10px", fontSize: 13, color: "#1e293b", outline: "none", background: disabled ? "transparent" : "white", fontWeight: 500 }} />
                      <input value={r.asunto} onChange={e => actualizar(r.id, "asunto", e.target.value)}
                        placeholder="Asunto / propÃ³sito" disabled={disabled}
                        style={{ border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "7px 10px", fontSize: 13, color: "#1e293b", outline: "none", background: disabled ? "transparent" : "white" }} />
                      <div style={{ display: "flex", gap: 4 }}>
                        {LUGARES.map(l => (
                          <button key={l.value} onClick={() => !disabled && actualizar(r.id, "lugar", l.value)} disabled={disabled}
                            title={l.label}
                            style={{ flex: 1, padding: "6px 4px", borderRadius: 7, border: `1.5px solid ${r.lugar === l.value ? "#1B2A4A" : "#E2E8F0"}`, background: r.lugar === l.value ? "#1B2A4A" : "white", color: r.lugar === l.value ? "white" : "#94a3b8", fontSize: 14, cursor: disabled ? "default" : "pointer", fontWeight: 600, textAlign: "center" }}>
                            {l.emoji}
                          </button>
                        ))}
                      </div>
                      {r.lugar === "otro" && (
                        <input value={r.lugarCustom || ""} onChange={e => actualizar(r.id, "lugarCustom", e.target.value)}
                          placeholder="Â¿DÃ³nde?" disabled={disabled}
                          style={{ border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "7px 10px", fontSize: 13, color: "#1e293b", outline: "none", background: disabled ? "transparent" : "white", gridColumn: "1 / -1" }} />
                      )}
                    </>
                  )}
                </div>

                {/* Estado */}
                <select value={r.estado} onChange={e => actualizar(r.id, "estado", e.target.value)}
                  style={{ border: `1.5px solid ${est.color}44`, borderRadius: 7, padding: "6px 10px", fontSize: 12, fontWeight: 700, color: est.color, background: "white", cursor: "pointer", outline: "none", minWidth: 130 }}>
                  {ESTADOS_REUNION.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>

                {!disabled && !modoBalance && (
                  <button onClick={() => eliminar(r.id)}
                    style={{ background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 16, padding: "4px", lineHeight: 1 }}>âœ•</button>
                )}
              </div>

              {/* Resultado (solo en logro/balance) */}
              {!disabled && r.estado !== "pendiente" && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${est.color}22` }}>
                  <input value={r.resultado} onChange={e => actualizar(r.id, "resultado", e.target.value)}
                    placeholder="Resultado / prÃ³ximo pasoâ€¦"
                    style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "7px 10px", fontSize: 12, color: "#475569", outline: "none", background: "white", boxSizing: "border-box" }} />
                </div>
              )}
              {modoBalance && r.resultado && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${est.color}22`, fontSize: 12, color: "#475569", fontStyle: "italic" }}>
                  ðŸ’¬ {r.resultado}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Agregar nueva reuniÃ³n */}
      {!disabled && !modoBalance && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={nuevaCliente} onChange={e => setNuevaCliente(e.target.value)}
              onKeyDown={e => e.key === "Enter" && agregar()}
              placeholder="Cliente / empresa"
              style={{ flex: 1, border: "1.5px dashed #CBD5E1", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1e293b", outline: "none", background: "#FAFBFC" }} />
            <input value={nuevoAsunto} onChange={e => setNuevoAsunto(e.target.value)}
              onKeyDown={e => e.key === "Enter" && agregar()}
              placeholder="Asunto / propÃ³sito"
              style={{ flex: 1.5, border: "1.5px dashed #CBD5E1", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1e293b", outline: "none", background: "#FAFBFC" }} />
            <div style={{ display: "flex", gap: 4 }}>
              {LUGARES.map(l => (
                <button key={l.value} onClick={() => setNuevoLugar(l.value)} title={l.label}
                  style={{ padding: "7px 10px", borderRadius: 7, border: `1.5px solid ${nuevoLugar === l.value ? "#1B2A4A" : "#E2E8F0"}`, background: nuevoLugar === l.value ? "#1B2A4A" : "white", color: nuevoLugar === l.value ? "white" : "#94a3b8", fontSize: 14, cursor: "pointer" }}>
                  {l.emoji}
                </button>
              ))}
            </div>
            <button onClick={agregar}
              style={{ background: "#1B2A4A", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              + Agregar
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, paddingLeft: 2 }}>
            {LUGARES.map(l => (
              <span key={l.value} style={{ fontSize: 11, color: nuevoLugar === l.value ? "#1B2A4A" : "#94a3b8", fontWeight: nuevoLugar === l.value ? 700 : 400 }}>
                {l.emoji} {l.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// â”€â”€ App principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function App() {
  const [mes, setMes] = useState(new Date().getMonth());
  const [aÃ±o, setAÃ±o] = useState(2026);
  const [linea, setLinea] = useState(0);
  const [fase, setFase] = useState("compromiso");
  const [data, setData] = useState({});
  const [copiado, setCopiado] = useState(false);
  const [verReporte, setVerReporte] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Cargar todos los datos desde Supabase al iniciar
  useEffect(() => {
    sbFetch("GET").then(rows => {
      if (Array.isArray(rows)) {
        const loaded = {};
        rows.forEach(row => { loaded[row.id] = row.data; });
        setData(loaded);
      }
      setCargando(false);
    }).catch(() => setCargando(f
       }, []);

  // Guardar en Supabase cuando cambian los datos
  const guardarEnNube = useCallback(async (key, value) => {
    setGuardando(true);
    await sbFetch("POST", key, { id: key, data: value, updated_at: new Date().toISOString() });
    setTimeout(() => setGuardando(false), 1000);
  }, []);

  const key = `${aÃ±o}-${mes}-${linea}`;
  const d = data[key] || emptyLine();

  const upd = (field) => (val) => {
    const newEntry = { ...(data[key] || emptyLine()), [field]: val };
    setData(p => ({ ...p, [key]: newEntry }));
    guardarEnNube(key, newEntry);
  };
  const updbool = (field) => () => {
    const newEntry = { ...(data[key] || emptyLine()), [field]: !(data[key] || emptyLine())[field] };
    setData(p => ({ ...p, [key]: newEntry }));
    guardarEnNube(key, newEntry);
  };

  // Genera texto del reporte semanal
  const generarReporte = () => {
    const hoy = new Date();
    const semana = `${hoy.getDate()}/${hoy.getMonth()+1}/${hoy.getFullYear()}`;
    const iconoSem = (p) => p === null ? "â¬œ" : p >= 100 ? "ðŸŸ¢" : p >= 80 ? "ðŸŸ¡" : "ðŸ”´";
    let txt = `ðŸ“Š *REPORTE SEMANAL â€” ${MESES[mes]} ${aÃ±o}*\n`;
    txt += `ðŸ“… Al ${semana}\n`;
    txt += `${"â”€".repeat(30)}\n\n`;

    let alertas = [];
    LINEAS.forEach((l, i) => {
      const e = data[`${aÃ±o}-${mes}-${i}`] || emptyLine();
      const p = pct(e.resultadoVenta, e.metaVenta);
      const icono = iconoSem(p);
      const est = estadoLinea(i);
      txt += `${icono} *${l.nombre}*`;
      if (e.responsable) txt += ` â€” ${e.responsable}`;
      txt += `\n`;
      if (e.metaVenta) {
        txt += `   Meta: $${(+e.metaVenta).toLocaleString("es-CL")}`;
        if (e.resultadoVenta) txt += ` â†’ Resultado: $${(+e.resultadoVenta).toLocaleString("es-CL")} (${p}%)`;
        else txt += ` â†’ Sin resultado aÃºn`;
        txt += `\n`;
      }
      const rReal = e.reunionesReal || 0;
      const rTotal = e.reunionesMeta || 0;
      if (rTotal > 0) txt += `   Reuniones: ${rReal}/${rTotal}\n`;
      if (e.opCerrarMeta) txt += `   Oport. cerradas: ${e.opCerradas||0}/${e.opCerrarMeta}\n`;
      if (e.cobranzaMeta) {
        const sobre = parseFloat(e.cobranzaReal) > parseFloat(e.cobranzaMeta);
        txt += `   Cobranza +10d: ${e.cobranzaReal||"â€”"} (mÃ¡x. ${e.cobranzaMeta})${sobre ? " âš ï¸" : " âœ“"}\n`;
        if (sobre) alertas.push(`${l.nombre}: cobranza sobre lÃ­mite (${e.cobranzaReal} vs. mÃ¡x. ${e.cobranzaMeta})`);
      }
      if (e.campana?.nombre) {
        const estC = ESTADOS_CAMPANA.find(x => x.value === e.campana.estado);
        txt += `   CampaÃ±a: ${e.campana.nombre} â€” ${estC?.label || "â€”"}\n`;
      }
      if (e.accion?.descripcion) {
        const estA = ESTADOS_CAMPANA.find(x => x.value === e.accion.estado);
        txt += `   AcciÃ³n especial: ${estA?.label || "â€”"}\n`;
      }
      if (est === "vacio") txt += `   âš ï¸ Sin datos ingresados\n`;
      if (p !== null && p < 80) alertas.push(`${l.nombre} al ${p}% de meta`);
      txt += `\n`;
    });

    if (alertas.length > 0) {
      txt += `${"â”€".repeat(30)}\n`;
      txt += `ðŸš¨ *ALERTAS*\n`;
      alertas.forEach(a => txt += `â€¢ ${a}\n`);
    }
    txt += `\n_Generado desde Tablero Daff_`;
    return txt;
  };

  const copiarReporte = () => {
    navigator.clipboard.writeText(generarReporte()).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const estadoLinea = (i) => {
    const e = data[`${aÃ±o}-${mes}-${i}`];
    if (!e) return "vacio";
    if (e.logroFirmado) return "cerrado";
    if (e.compromisoFirmado) return "comprometido";
    if (e.metaVenta || e.reunionesMeta) return "borrador";
    return "vacio";
  };
  const estadoColor = { vacio: "#CBD5E1", borrador: "#93C5FD", comprometido: "#F59E0B", cerrado: "#22C55E" };
  const estadoLabel = { vacio: "Sin datos", borrador: "En progreso", comprometido: "Comprometido", cerrado: "Cerrado" };

  const ventaPct = pct(d.resultadoVenta, d.metaVenta);
  const vs = semaforo(ventaPct);

  const reunionesRealizadas = +d.reunionesReal || 0;
  const reunionesPendientes = 0;

  if (cargando) return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F0F4FA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 36 }}>â˜ï¸</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1B2A4A" }}>Cargando datos desde la nubeâ€¦</div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>Conectando con Supabase</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F0F4FA", minHeight: "100vh" }}>

      {/* HEADER */}
      <div style={{ background: "#1B2A4A" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#60A5FA", marginBottom: 6 }}>Tablero de Compromisos</div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "white" }}>Seguimiento Mensual</h1>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {guardando
                ? <span style={{ fontSize: 12, color: "#93C5FD", fontWeight: 600 }}>â˜ï¸ Guardandoâ€¦</span>
                : <span style={{ fontSize: 12, color: "#4ADE80", fontWeight: 600 }}>âœ“ Sincronizado</span>
              }
              <select value={mes} onChange={e => setMes(+e.target.value)}
                style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {MESES.map((m,i) => <option key={i} value={i} style={{ color: "#1B2A4A", background: "white" }}>{m}</option>)}
              </select>
              <select value={aÃ±o} onChange={e => setAÃ±o(+e.target.value)}
                style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {[2025,2026,2027].map(y => <option key={y} value={y} style={{ color: "#1B2A4A", background: "white" }}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* PestaÃ±as lÃ­neas */}
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 0 }}>
            {LINEAS.map((l, i) => {
              const est = estadoLinea(i);
              const activo = linea === i;
              return (
                <button key={i} onClick={() => setLinea(i)}
                  style={{ padding: "10px 14px", borderRadius: "10px 10px 0 0", border: "none", background: activo ? "white" : "rgba(255,255,255,0.07)", color: activo ? "#1B2A4A" : "#94a3b8", fontSize: 13, fontWeight: activo ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: estadoColor[est], flexShrink: 0 }} />
                  {l.emoji} {l.nombre}
                </button>
              );
            })}
          </div>
        </div>
      </div>                        
