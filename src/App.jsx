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
    setTimeout(() => setGuardando(false), 1
