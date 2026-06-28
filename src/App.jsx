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
  { nombre: "Junaeb", emoji: "🏫" },
  { nombre: "Retail", emoji: "🛒" },
  { nombre: "Food Service", emoji: "🍽️" },
  { nombre: "Mercado Público", emoji: "🏛️" },
  { nombre: "Remoto", emoji: "📡" },
  { nombre: "Peff (Mascotas)", emoji: "🐾" },
  { nombre: "Internacional", emoji: "🌎" },
];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const ESTADOS_REUNION = [
  { value: "pendiente", label: "Pendiente", color: "#94a3b8", bg: "#F1F5F9" },
  { value: "realizada", label: "Realizada ✓", color: "#16a34a", bg: "#F0FDF4" },
  { value: "postergada", label: "Postergada", color: "#d97706", bg: "#FFFBEB" },
  { value: "caida", label: "No se realizó", color: "#dc2626", bg: "#FEF2F2" },
];

const LUGARES = [
  { value: "daff", label: "En Daff", emoji: "🏢" },
  { value: "cliente", label: "Donde el cliente", emoji: "📍" },
  { value: "virtual", label: "Virtual", emoji: "💻" },
  { value: "otro", label: "Otro", emoji: "📌" },
];

const newReunion = () => ({ id: Date.now() + Math.random(), cliente: "", asunto: "", lugar: "virtual", lugarCustom: "", estado: "pendiente", resultado: "" });

const TIPOS_CAMPANA = [
  { value: "fidelidad",  label: "Fidelidad",   emoji: "❤️" },
  { value: "promocion",  label: "Promoción",    emoji: "🏷️" },
  { value: "catalogo",   label: "Catálogo",     emoji: "📖" },
  { value: "video",      label: "Video",        emoji: "🎬" },
  { value: "lanzamiento",label: "Lanzamiento",  emoji: "🚀" },
  { value: "otra",       label: "Otra",         emoji: "📣" },
];

const ESTADOS_CAMPANA = [
  { value: "planificada", label: "Planificada",   color: "#94a3b8", bg: "#F1F5F9" },
  { value: "ejecutada",   label: "Ejecutada ✓",   color: "#16a34a", bg: "#F0FDF4" },
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
  accion: { descripcion: "", estado: "pendiente" },  // acción especial del mes (ej: liquidación de stock)
  compromisoFirmado: false,
  logroFirmado: false,
});

const fmt = (v, prefix = "", suffix = "") => {
  if (v === "" || v === undefined) return "—";
  const n = parseFloat(v);
  if (isNaN(n)) return "—";
  return `${prefix}${n.toLocaleString("es-CL")}${suffix}`;
};

const pct = (real, meta) => {
  const r = parseFloat(real), m = parseFloat(meta);
  if (!r || !m || m === 0) return null;
  return Math.round((r / m) * 100);
};

const semaforo = (p) => {
  if (p === null) return { color: "#94a3b8", bg: "#F1F5F9", label: "Sin datos" };
  if (p >= 100) return { color: "#16a34a", bg: "#DCFCE7", label: "Logrado ✓" };
  if (p >= 80) return { color: "#d97706", bg: "#FEF3C7", label: "Cerca" };
  return { color: "#dc2626", bg: "#FEE2E2", label: "Brecha" };
};

// Semáforo invertido: menos real que meta = bueno
const semaforoInverso = (real, meta) => {
  const r = parseFloat(real), m = parseFloat(meta);
  if (isNaN(r) || isNaN(m) || m === 0) return { color: "#94a3b8", bg: "#F1F5F9", label: "Sin datos", pct: null };
  const p = Math.round((r / m) * 100);
  if (r <= m) return { color: "#16a34a", bg: "#DCFCE7", label: "Bajo control ✓", pct: p };
  if (p <= 130) return { color: "#d97706", bg: "#FEF3C7", label: "Atención", pct: p };
  return { color: "#dc2626", bg: "#FEE2E2", label: "Alerta 🚨", pct: p };
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
    ? `${diff > 0 ? "+" : ""}${Math.abs(diff)} vs. máx`
    : null;
  return (
    <div style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${s.color}22` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        💳 Clientes atrasados +10d
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "6px 0 2px" }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{real !== "" && real !== undefined ? real : "—"}</span>
        {s.pct !== null && <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>({s.pct}% del máx.)</span>}
      </div>
      <div style={{ fontSize: 12, color: "#64748b" }}>
        Máximo comprometido: <strong>{meta || "—"}</strong>
        {diffStr && <span style={{ marginLeft: 8, color: s.color, fontWeight: 700 }}>{diffStr}</span>}
      </div>
      <div style={{ height: 5, background: "rgba(0,0,0,0.08)", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
        <div style={{ height: "100%", width: `${Math.min(s.pct || 0, 100)}%`, background: s.color, borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginTop: 5 }}>{s.label}</div>
    </div>
  );
};

// ── Componente de Reuniones ──────────────────────────────────────────
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
          <span style={{ color: "#94a3b8", fontSize: 12, padding: "3px 0" }}>— {reuniones.length} total</span>
        </div>
      )}

      {/* Lista de reuniones */}
      {reuniones.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "#cbd5e1", fontSize: 13 }}>
          No hay reuniones planificadas aún
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
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginTop: 2 }}>{r.cliente || <span style={{ color: "#cbd5e1" }}>—</span>}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Asunto</div>
                        <div style={{ fontSize: 14, color: "#1e293b", marginTop: 2 }}>{r.asunto || <span style={{ color: "#cbd5e1" }}>—</span>}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Lugar</div>
                        <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                          {(() => { const l = LUGARES.find(x => x.value === r.lugar); return l ? `${l.emoji} ${r.lugar === "otro" && r.lugarCustom ? r.lugarCustom : l.label}` : "—"; })()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <input value={r.cliente} onChange={e => actualizar(r.id, "cliente", e.target.value)}
                        placeholder="Cliente / empresa" disabled={disabled}
                        style={{ border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "7px 10px", fontSize: 13, color: "#1e293b", outline: "none", background: disabled ? "transparent" : "white", fontWeight: 500 }} />
                      <input value={r.asunto} onChange={e => actualizar(r.id, "asunto", e.target.value)}
                        placeholder="Asunto / propósito" disabled={disabled}
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
                          placeholder="¿Dónde?" disabled={disabled}
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
                    style={{ background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 16, padding: "4px", lineHeight: 1 }}>✕</button>
                )}
              </div>

              {/* Resultado (solo en logro/balance) */}
              {!disabled && r.estado !== "pendiente" && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${est.color}22` }}>
                  <input value={r.resultado} onChange={e => actualizar(r.id, "resultado", e.target.value)}
                    placeholder="Resultado / próximo paso…"
                    style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 7, padding: "7px 10px", fontSize: 12, color: "#475569", outline: "none", background: "white", boxSizing: "border-box" }} />
                </div>
              )}
              {modoBalance && r.resultado && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${est.color}22`, fontSize: 12, color: "#475569", fontStyle: "italic" }}>
                  💬 {r.resultado}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Agregar nueva reunión */}
      {!disabled && !modoBalance && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={nuevaCliente} onChange={e => setNuevaCliente(e.target.value)}
              onKeyDown={e => e.key === "Enter" && agregar()}
              placeholder="Cliente / empresa"
              style={{ flex: 1, border: "1.5px dashed #CBD5E1", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1e293b", outline: "none", background: "#FAFBFC" }} />
            <input value={nuevoAsunto} onChange={e => setNuevoAsunto(e.target.value)}
              onKeyDown={e => e.key === "Enter" && agregar()}
              placeholder="Asunto / propósito"
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

// ── App principal ────────────────────────────────────────────────────
export default function App() {
  const [mes, setMes] = useState(new Date().getMonth());
  const [año, setAño] = useState(2026);
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
    }).catch(() => setCargando(false));
  }, []);

  // Guardar en Supabase cuando cambian los datos
  const guardarEnNube = useCallback(async (key, value) => {
    setGuardando(true);
    await sbFetch("POST", key, { id: key, data: value, updated_at: new Date().toISOString() });
    setTimeout(() => setGuardando(false), 1000);
  }, []);

  const key = `${año}-${mes}-${linea}`;
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
    const iconoSem = (p) => p === null ? "⬜" : p >= 100 ? "🟢" : p >= 80 ? "🟡" : "🔴";
    let txt = `📊 *REPORTE SEMANAL — ${MESES[mes]} ${año}*\n`;
    txt += `📅 Al ${semana}\n`;
    txt += `${"─".repeat(30)}\n\n`;

    let alertas = [];
    LINEAS.forEach((l, i) => {
      const e = data[`${año}-${mes}-${i}`] || emptyLine();
      const p = pct(e.resultadoVenta, e.metaVenta);
      const icono = iconoSem(p);
      const est = estadoLinea(i);
      txt += `${icono} *${l.nombre}*`;
      if (e.responsable) txt += ` — ${e.responsable}`;
      txt += `\n`;
      if (e.metaVenta) {
        txt += `   Meta: $${(+e.metaVenta).toLocaleString("es-CL")}`;
        if (e.resultadoVenta) txt += ` → Resultado: $${(+e.resultadoVenta).toLocaleString("es-CL")} (${p}%)`;
        else txt += ` → Sin resultado aún`;
        txt += `\n`;
      }
      const rReal = e.reunionesReal || 0;
      const rTotal = e.reunionesMeta || 0;
      if (rTotal > 0) txt += `   Reuniones: ${rReal}/${rTotal}\n`;
      if (e.opCerrarMeta) txt += `   Oport. cerradas: ${e.opCerradas||0}/${e.opCerrarMeta}\n`;
      if (e.cobranzaMeta) {
        const sobre = parseFloat(e.cobranzaReal) > parseFloat(e.cobranzaMeta);
        txt += `   Cobranza +10d: ${e.cobranzaReal||"—"} (máx. ${e.cobranzaMeta})${sobre ? " ⚠️" : " ✓"}\n`;
        if (sobre) alertas.push(`${l.nombre}: cobranza sobre límite (${e.cobranzaReal} vs. máx. ${e.cobranzaMeta})`);
      }
      if (e.campana?.nombre) {
        const estC = ESTADOS_CAMPANA.find(x => x.value === e.campana.estado);
        txt += `   Campaña: ${e.campana.nombre} — ${estC?.label || "—"}\n`;
      }
      if (e.accion?.descripcion) {
        const estA = ESTADOS_CAMPANA.find(x => x.value === e.accion.estado);
        txt += `   Acción especial: ${estA?.label || "—"}\n`;
      }
      if (est === "vacio") txt += `   ⚠️ Sin datos ingresados\n`;
      if (p !== null && p < 80) alertas.push(`${l.nombre} al ${p}% de meta`);
      txt += `\n`;
    });

    if (alertas.length > 0) {
      txt += `${"─".repeat(30)}\n`;
      txt += `🚨 *ALERTAS*\n`;
      alertas.forEach(a => txt += `• ${a}\n`);
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
    const e = data[`${año}-${mes}-${i}`];
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
      <div style={{ fontSize: 36 }}>☁️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1B2A4A" }}>Cargando datos desde la nube…</div>
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
                ? <span style={{ fontSize: 12, color: "#93C5FD", fontWeight: 600 }}>☁️ Guardando…</span>
                : <span style={{ fontSize: 12, color: "#4ADE80", fontWeight: 600 }}>✓ Sincronizado</span>
              }
              <select value={mes} onChange={e => setMes(+e.target.value)}
                style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {MESES.map((m,i) => <option key={i} value={i} style={{ color: "#1B2A4A", background: "white" }}>{m}</option>)}
              </select>
              <select value={año} onChange={e => setAño(+e.target.value)}
                style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {[2025,2026,2027].map(y => <option key={y} value={y} style={{ color: "#1B2A4A", background: "white" }}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Pestañas líneas */}
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

      {/* CONTENIDO */}
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 20px 40px" }}>
        <div style={{ background: "white", borderRadius: "0 0 16px 16px", border: "1.5px solid #E2E8F0", borderTop: "none", padding: "24px 24px 28px", boxShadow: "0 4px 20px rgba(27,42,74,0.08)" }}>

          {/* Cabecera línea */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{LINEAS[linea].emoji}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1B2A4A" }}>{LINEAS[linea].nombre}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{MESES[mes]} {año}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Responsable:</span>
              <input value={d.responsable} onChange={e => upd("responsable")(e.target.value)} placeholder="Nombre"
                style={{ border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "7px 12px", fontSize: 13, color: "#1B2A4A", outline: "none", background: "#FAFBFC", width: 160 }} />
            </div>
          </div>

          {/* Tabs fase */}
          <div style={{ display: "flex", gap: 3, background: "#F1F5F9", borderRadius: 10, padding: 3, marginBottom: 24, width: "fit-content" }}>
            {[["compromiso","🎯 Compromiso"], ["logro","✅ Logro"], ["balance","⚖️ Balance"]].map(([v, label]) => (
              <button key={v} onClick={() => setFase(v)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: fase === v ? "white" : "transparent", color: fase === v ? "#1B2A4A" : "#64748b", fontSize: 13, fontWeight: fase === v ? 700 : 500, cursor: "pointer", boxShadow: fase === v ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── COMPROMISO ── */}
          {fase === "compromiso" && (
            <div>
              <div style={{ fontSize: 12, color: "#64748b", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", marginBottom: 22 }}>
                📌 <strong>Inicio de mes:</strong> Declara tus compromisos. Una vez firmados, son la vara de medida del mes.
              </div>

              {/* KPIs */}
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1B2A4A", marginBottom: 10 }}>Metas</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                <Input label="Meta de Venta" value={d.metaVenta} onChange={upd("metaVenta")} prefix="$" disabled={d.compromisoFirmado} />
                <Input label="Precio / Kilo Esperado" value={d.precioPorKilo} onChange={upd("precioPorKilo")} prefix="$" disabled={d.compromisoFirmado} />
                <Input label="Margen Esperado" value={d.margen} onChange={upd("margen")} suffix="%" disabled={d.compromisoFirmado} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
                <Input label="Reuniones planificadas" value={d.reunionesMeta} onChange={upd("reunionesMeta")} disabled={d.compromisoFirmado} />
                <Input label="Oportunidades a cerrar" value={d.opCerrarMeta} onChange={upd("opCerrarMeta")} disabled={d.compromisoFirmado} />
                <Input label="Nuevos clientes meta" value={d.nuevosClientesMeta} onChange={upd("nuevosClientesMeta")} disabled={d.compromisoFirmado} />
                <Input label="Máx. clientes atrasados +10d" value={d.cobranzaMeta} onChange={upd("cobranzaMeta")} disabled={d.compromisoFirmado} />
              </div>

              {/* Campaña */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1B2A4A", marginBottom: 4 }}>📣 Campaña del mes</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>Define la campaña comunicacional principal de esta unidad para el mes.</div>
                <div style={{ border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "16px", background: "#FAFBFC", display: "flex", flexDirection: "column", gap: 12 }}>
                  <input
                    value={d.campana.nombre} disabled={d.compromisoFirmado}
                    onChange={e => upd("campana")({ ...d.campana, nombre: e.target.value })}
                    placeholder="Nombre de la campaña — ej: Catálogo invierno, Promo fidelidad mayo…"
                    style={{ border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 14, color: "#1e293b", outline: "none", background: d.compromisoFirmado ? "#F8FAFC" : "white", fontWeight: 500 }} />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {TIPOS_CAMPANA.map(t => (
                      <button key={t.value} disabled={d.compromisoFirmado}
                        onClick={() => upd("campana")({ ...d.campana, tipo: t.value })}
                        style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${d.campana.tipo === t.value ? "#1B2A4A" : "#E2E8F0"}`, background: d.campana.tipo === t.value ? "#1B2A4A" : "white", color: d.campana.tipo === t.value ? "white" : "#64748b", fontSize: 12, fontWeight: d.campana.tipo === t.value ? 700 : 500, cursor: d.compromisoFirmado ? "default" : "pointer" }}>
                        {t.emoji} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Acción especial del mes */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1B2A4A", marginBottom: 4 }}>📦 Acción especial del mes</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>Liquidación de stock, reubicación, oferta puntual u otra acción concreta que el área se compromete a ejecutar.</div>
                <textarea
                  value={d.accion.descripcion}
                  disabled={d.compromisoFirmado}
                  onChange={e => upd("accion")({ ...d.accion, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Describe la acción — ej: Liquidar 200 kg de producto X a precio de costo, reubicando stock en sucursal Y antes del día 20…"
                  style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#1e293b", resize: "vertical", outline: "none", background: d.compromisoFirmado ? "#F8FAFC" : "white", boxSizing: "border-box", lineHeight: 1.6 }} />
              </div>

              {/* Notas */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Foco del mes</label>
                <textarea value={d.notasCompromiso} onChange={e => upd("notasCompromiso")(e.target.value)} disabled={d.compromisoFirmado} rows={2}
                  placeholder="¿Cuál es la prioridad de este mes?"
                  style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#1e293b", resize: "vertical", outline: "none", background: d.compromisoFirmado ? "#F8FAFC" : "white", boxSizing: "border-box" }} />
              </div>

              {!d.compromisoFirmado ? (
                <button onClick={updbool("compromisoFirmado")} disabled={!d.responsable}
                  style={{ background: !d.responsable ? "#E2E8F0" : "#1B2A4A", color: !d.responsable ? "#94a3b8" : "white", border: "none", borderRadius: 10, padding: "12px 26px", fontSize: 14, fontWeight: 700, cursor: !d.responsable ? "not-allowed" : "pointer" }}>
                  ✍️ Firmar compromiso — {d.responsable || "ingresa nombre primero"}
                </button>
              ) : (
                <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>Compromiso firmado — {d.responsable}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Meta ${(+d.metaVenta||0).toLocaleString("es-CL")} · {d.margen}% margen · {d.reunionesMeta || 0} reuniones · {d.opCerrarMeta || 0} oportunidades a cerrar
                      </div>
                    </div>
                  </div>
                  <button onClick={updbool("compromisoFirmado")} style={{ background: "transparent", border: "1px solid #BBF7D0", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#64748b", cursor: "pointer" }}>Editar</button>
                </div>
              )}
            </div>
          )}

          {/* ── LOGRO ── */}
          {fase === "logro" && (
            <div>
              {!d.compromisoFirmado && (
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#92400E" }}>
                  ⚠️ El compromiso aún no está firmado.
                </div>
              )}
              <div style={{ fontSize: 12, color: "#64748b", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", marginBottom: 22 }}>
                📊 <strong>Cierre de mes:</strong> Registra los resultados reales y actualiza el estado de cada reunión.
              </div>

              {/* Resultados KPI */}
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1B2A4A", marginBottom: 10 }}>Resultados</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                <Input label="Resultado Venta" value={d.resultadoVenta} onChange={upd("resultadoVenta")} prefix="$" />
                <Input label="Precio / Kilo Real" value={d.precioPorKiloReal} onChange={upd("precioPorKiloReal")} prefix="$" />
                <Input label="Margen Real" value={d.margenReal} onChange={upd("margenReal")} suffix="%" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                <Input label="Reuniones realizadas" value={d.reunionesReal} onChange={upd("reunionesReal")} />
                <Input label="Oportunidades cerradas" value={d.opCerradas} onChange={upd("opCerradas")} />
                <Input label="Nuevos clientes" value={d.nuevosClientes} onChange={upd("nuevosClientes")} />
                <Input label="Clientes atrasados +10d" value={d.cobranzaReal} onChange={upd("cobranzaReal")} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                <Input label="Opor. activas" value={d.opActivas} onChange={upd("opActivas")} />
                <Input label="Opor. perdidas" value={d.opPerdidas} onChange={upd("opPerdidas")} />
                <Input label="Opor. nuevas" value={d.opNuevas} onChange={upd("opNuevas")} />
              </div>

              {/* Campaña — estado */}
              {d.campana.nombre && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1B2A4A", marginBottom: 10 }}>📣 Campaña del mes</div>
                  <div style={{ border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "14px 16px", background: (() => { const e = ESTADOS_CAMPANA.find(x => x.value === d.campana.estado); return e?.bg || "#F8FAFC"; })() }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                          {TIPOS_CAMPANA.find(t => t.value === d.campana.tipo)?.emoji} {d.campana.nombre}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          {TIPOS_CAMPANA.find(t => t.value === d.campana.tipo)?.label}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {ESTADOS_CAMPANA.map(e => (
                          <button key={e.value} onClick={() => upd("campana")({ ...d.campana, estado: e.value })}
                            style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${d.campana.estado === e.value ? e.color : "#E2E8F0"}`, background: d.campana.estado === e.value ? e.bg : "white", color: d.campana.estado === e.value ? e.color : "#94a3b8", fontSize: 12, fontWeight: d.campana.estado === e.value ? 700 : 500, cursor: "pointer" }}>
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Acción especial — estado */}
              {d.accion.descripcion && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1B2A4A", marginBottom: 10 }}>📦 Acción especial del mes</div>
                  <div style={{ border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "14px 16px", background: "#FAFBFC" }}>
                    <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 12, fontStyle: "italic" }}>
                      "{d.accion.descripcion}"
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {ESTADOS_CAMPANA.map(e => (
                        <button key={e.value} onClick={() => upd("accion")({ ...d.accion, estado: e.value })}
                          style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${d.accion.estado === e.value ? e.color : "#E2E8F0"}`, background: d.accion.estado === e.value ? e.bg : "white", color: d.accion.estado === e.value ? e.color : "#94a3b8", fontSize: 12, fontWeight: d.accion.estado === e.value ? 700 : 500, cursor: "pointer" }}>
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reflexión */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Reflexión de cierre</label>
                <textarea value={d.notasLogro} onChange={e => upd("notasLogro")(e.target.value)} rows={2}
                  placeholder="¿Qué explica los resultados? ¿Qué harías distinto el próximo mes?"
                  style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#1e293b", resize: "vertical", outline: "none", background: "white", boxSizing: "border-box" }} />
              </div>

              {!d.logroFirmado ? (
                <button onClick={updbool("logroFirmado")} disabled={!d.resultadoVenta}
                  style={{ background: !d.resultadoVenta ? "#E2E8F0" : "#15803D", color: !d.resultadoVenta ? "#94a3b8" : "white", border: "none", borderRadius: 10, padding: "12px 26px", fontSize: 14, fontWeight: 700, cursor: !d.resultadoVenta ? "not-allowed" : "pointer" }}>
                  ✍️ Cerrar mes — confirmar resultados
                </button>
              ) : (
                <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span>🔒</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>Mes cerrado</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Venta: ${(+d.resultadoVenta||0).toLocaleString("es-CL")} · {d.reunionesReal||0}/{d.reunionesMeta||0} reuniones · {d.opCerradas||0} oportunidades cerradas</div>
                    </div>
                  </div>
                  <button onClick={updbool("logroFirmado")} style={{ background: "transparent", border: "1px solid #BBF7D0", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#64748b", cursor: "pointer" }}>Editar</button>
                </div>
              )}
            </div>
          )}

          {/* ── BALANCE ── */}
          {fase === "balance" && (
            <div>
              {(!d.metaVenta && !d.resultadoVenta && d.reuniones.length === 0) ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#cbd5e1" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Sin datos para {LINEAS[linea].nombre}</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Completa el compromiso y el logro primero</div>
                </div>
              ) : (
                <div>
                  {/* KPI central venta */}
                  {(d.metaVenta || d.resultadoVenta) && (
                    <div style={{ textAlign: "center", background: vs.bg, borderRadius: 14, padding: "22px 20px", marginBottom: 22, border: `2px solid ${vs.color}22` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Cumplimiento de Venta</div>
                      <div style={{ fontSize: 52, fontWeight: 900, color: vs.color, lineHeight: 1.1, margin: "6px 0 2px" }}>
                        {ventaPct !== null ? `${ventaPct}%` : "—"}
                      </div>
                      <div style={{ fontSize: 14, color: "#64748b" }}>
                        ${(+d.resultadoVenta||0).toLocaleString("es-CL")} <span style={{ color: "#cbd5e1" }}>de</span> ${(+d.metaVenta||0).toLocaleString("es-CL")}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: vs.color, marginTop: 4 }}>{vs.label}</div>
                    </div>
                  )}

                  {/* KPIs */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 10, marginBottom: 22 }}>
                    <Delta label="Precio / Kilo" meta={d.precioPorKilo} real={d.precioPorKiloReal} prefix="$" />
                    <Delta label="Margen" meta={d.margen} real={d.margenReal} suffix="%" />
                    {d.nuevosClientes && (
                      <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 16px", border: "1.5px solid #E2E8F0" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Nuevos Clientes</div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: "#1B2A4A", marginTop: 6 }}>{d.nuevosClientes}</div>
                      </div>
                    )}
                  </div>

                  {/* Reuniones, oportunidades y cobranza */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 10, marginBottom: 22 }}>
                    <Delta label="Reuniones" meta={d.reunionesMeta} real={d.reunionesReal} />
                    <Delta label="Opor. a cerrar" meta={d.opCerrarMeta} real={d.opCerradas} />
                    <Delta label="Nuevos clientes" meta={d.nuevosClientesMeta} real={d.nuevosClientes} />
                    <DeltaCobranza meta={d.cobranzaMeta} real={d.cobranzaReal} />
                  </div>

                  {/* Pipeline otros */}
                  {(d.opActivas || d.opPerdidas || d.opNuevas) && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Pipeline</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                        {[["Activas",d.opActivas,"#3B82F6","#EFF6FF"],["Perdidas",d.opPerdidas,"#dc2626","#FEF2F2"],["Nuevas",d.opNuevas,"#d97706","#FFFBEB"]].map(([label,val,color,bg]) => (
                          <div key={label} style={{ background: bg, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color }}>{val || "—"}</div>
                            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 3 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Campaña balance */}
                  {d.campana.nombre && (() => {
                    const tipo = TIPOS_CAMPANA.find(t => t.value === d.campana.tipo);
                    const est = ESTADOS_CAMPANA.find(e => e.value === d.campana.estado);
                    return (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>📣 Campaña del mes</div>
                        <div style={{ background: est?.bg || "#F8FAFC", border: `1.5px solid ${est?.color || "#E2E8F0"}33`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ fontSize: 28 }}>{tipo?.emoji}</div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{d.campana.nombre}</div>
                              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{tipo?.label}</div>
                            </div>
                          </div>
                          <div style={{ background: est?.bg, border: `1.5px solid ${est?.color}44`, borderRadius: 20, padding: "6px 16px", color: est?.color, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                            {est?.label}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Acción especial balance */}
                  {d.accion.descripcion && (() => {
                    const est = ESTADOS_CAMPANA.find(e => e.value === d.accion.estado);
                    return (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>📦 Acción especial del mes</div>
                        <div style={{ background: est?.bg || "#F8FAFC", border: `1.5px solid ${est?.color || "#E2E8F0"}33`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, fontStyle: "italic", flex: 1 }}>
                            "{d.accion.descripcion}"
                          </div>
                          <div style={{ background: est?.bg, border: `1.5px solid ${est?.color}44`, borderRadius: 20, padding: "6px 16px", color: est?.color, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                            {est?.label}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Reflexiones */}
                  {(d.notasCompromiso || d.notasLogro) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {d.notasCompromiso && (
                        <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "12px 14px", border: "1px solid #BFDBFE" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>🎯 Foco declarado</div>
                          <div style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.55 }}>{d.notasCompromiso}</div>
                        </div>
                      )}
                      {d.notasLogro && (
                        <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "12px 14px", border: "1px solid #BBF7D0" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>✅ Reflexión de cierre</div>
                          <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.55 }}>{d.notasLogro}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* TABLA RESUMEN */}
        <div style={{ background: "white", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "20px 24px", marginTop: 14, boxShadow: "0 2px 8px rgba(27,42,74,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2A4A" }}>Resumen {MESES[mes]} {año}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setVerReporte(!verReporte)}
                style={{ background: verReporte ? "#EFF6FF" : "#F8FAFC", color: verReporte ? "#1D4ED8" : "#64748b", border: `1.5px solid ${verReporte ? "#BFDBFE" : "#E2E8F0"}`, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {verReporte ? "Ocultar reporte" : "👁 Ver reporte"}
              </button>
              <button onClick={copiarReporte}
                style={{ background: copiado ? "#F0FDF4" : "#1B2A4A", color: copiado ? "#15803D" : "white", border: `1.5px solid ${copiado ? "#BBF7D0" : "transparent"}`, borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                {copiado ? "✓ Copiado" : "📋 Copiar reporte semanal"}
              </button>
            </div>
          </div>

          {/* Preview reporte */}
          {verReporte && (
            <div style={{ background: "#0F172A", borderRadius: 10, padding: "18px 20px", marginBottom: 18, fontFamily: "monospace", fontSize: 13, color: "#E2E8F0", lineHeight: 1.7, whiteSpace: "pre-wrap", overflowX: "auto" }}>
              {generarReporte()}
            </div>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Línea","Responsable","Meta","Resultado","%","Reuniones","Estado"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #F1F5F9" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LINEAS.map((l, i) => {
                const k = `${año}-${mes}-${i}`;
                const e = data[k] || emptyLine();
                const est = estadoLinea(i);
                const p = pct(e.resultadoVenta, e.metaVenta);
                const s = semaforo(p);
                const rReal = e.reunionesReal || 0;
                const rTotal = e.reunionesMeta || 0;
                return (
                  <tr key={i} onClick={() => setLinea(i)} style={{ cursor: "pointer", background: linea === i ? "#EFF6FF" : "white" }}>
                    <td style={{ padding: "10px", fontWeight: 600, color: "#1B2A4A", borderBottom: "1px solid #F8FAFC" }}>{l.emoji} {l.nombre}</td>
                    <td style={{ padding: "10px", color: "#64748b", borderBottom: "1px solid #F8FAFC" }}>{e.responsable || <span style={{ color: "#CBD5E1" }}>—</span>}</td>
                    <td style={{ padding: "10px", color: "#64748b", borderBottom: "1px solid #F8FAFC" }}>{e.metaVenta ? `$${(+e.metaVenta).toLocaleString("es-CL")}` : "—"}</td>
                    <td style={{ padding: "10px", fontWeight: 600, color: "#1B2A4A", borderBottom: "1px solid #F8FAFC" }}>{e.resultadoVenta ? `$${(+e.resultadoVenta).toLocaleString("es-CL")}` : "—"}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #F8FAFC" }}>
                      {p !== null ? <span style={{ fontWeight: 700, color: s.color }}>{p}%</span> : <span style={{ color: "#E2E8F0" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px", color: "#64748b", borderBottom: "1px solid #F8FAFC" }}>
                      {rTotal > 0 ? <span>{rReal}<span style={{ color: "#cbd5e1" }}>/{rTotal}</span></span> : <span style={{ color: "#E2E8F0" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #F8FAFC" }}>
                      <span style={{ background: `${estadoColor[est]}22`, color: estadoColor[est], borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{estadoLabel[est]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
