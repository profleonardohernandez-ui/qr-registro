document.addEventListener("DOMContentLoaded", () => {
  // --- UI ---
  const scanBtn = document.getElementById("scanBtn");
  const cancelScanBtn = document.getElementById("cancelScanBtn");
  const guardarBtn = document.getElementById("guardarBtn");
  const limpiarBtn = document.getElementById("limpiarBtn");
  const exportarBtn = document.getElementById("exportarBtn");

  const qrReader = document.getElementById("qr-reader");
  const notice = document.getElementById("notice");
  const formEvento = document.getElementById("formEvento");

  const codigoActual = document.getElementById("codigoActual");
  const horaActual = document.getElementById("horaActual");

  const tipo = document.getElementById("tipo");
  const wrapExcusa = document.getElementById("wrapExcusa");
  const excusa = document.getElementById("excusa");
  const wrapNivel = document.getElementById("wrapNivel");
  const nivel = document.getElementById("nivel");
  const wrapObsTipo = document.getElementById("wrapObsTipo");
  const obsTipo = document.getElementById("obsTipo");
  const obs = document.getElementById("obs");

  const historial = document.getElementById("historial");
  const totalReg = document.getElementById("totalReg");

  // --- State ---
  let qrScanner = null;
  let pending = null;

  // --- Storage ---
  const KEY = "registros_qr_v1";

  // Observaciones tipo (Llegada tarde): defaults + persistentes
  const OBS_CUSTOM_KEY = "obs_tarde_custom_v1";
  const OBS_DEFAULT = [
    "Estaba comprando en la tienda",
    "No escuché el timbre",
    "Se me olvidó",
    "Estaba con otro profesor"
  ];

  function getRegistros() {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return arr.map((r) => ({
        codigo: r.codigo || "",
        fecha: r.fecha || "",
        hora: r.hora || "",
        fechaISO: r.fechaISO || "",
        timestamp: r.timestamp || "",
        tipo: r.tipo || "INASISTENCIA",
        excusa: r.excusa ?? null,
        nivel: (function () {
          const n = r.nivel || null;
          if (n === "LEVE") return "TIPO_I";
          if (n === "MODERADO") return "TIPO_II";
          if (n === "GRAVE") return "TIPO_III";
          return n;
        })(),
        obs: r.obs || ""
      }));
    } catch {
      return [];
    }
  }

  function setRegistros(arr) {
    localStorage.setItem(KEY, JSON.stringify(arr));
  }

  function addRegistro(reg) {
    const arr = getRegistros();
    arr.unshift(reg);
    setRegistros(arr);
    renderRegistros();
  }

  function clearRegistros() {
    localStorage.removeItem(KEY);
    renderRegistros();
  }

  // --- Observaciones tipo persistentes (Llegada tarde) ---
  function normalize(s) {
    return String(s || "").trim();
  }

  function lower(s) {
    return normalize(s).toLowerCase();
  }

  function getCustomObs() {
    try {
      const raw = localStorage.getItem(OBS_CUSTOM_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.map(normalize).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  function setCustomObs(arr) {
    localStorage.setItem(OBS_CUSTOM_KEY, JSON.stringify(arr));
  }

  function addCustomObsIfNeeded(text) {
    const t = normalize(text);
    if (!t) return false;

    // No guardar si ya existe en defaults/custom (case-insensitive)
    const tL = lower(t);
    const all = [...OBS_DEFAULT, ...getCustomObs()];
    if (all.some((x) => lower(x) === tL)) return false;

    const custom = getCustomObs();
    custom.push(t);
    setCustomObs(custom);
    return true;
  }

  function buildObsTipoOptions() {
    if (!obsTipo) return;

    const current = obsTipo.value || "";
    const custom = getCustomObs();

    // reconstruir desde cero
    obsTipo.innerHTML = "";

    // placeholder
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "— seleccionar —";
    obsTipo.appendChild(opt0);

    // defaults
    for (const t of OBS_DEFAULT) {
      const o = document.createElement("option");
      o.value = t;
      o.textContent = t;
      obsTipo.appendChild(o);
    }

    // custom persistentes
    for (const t of custom) {
      const o = document.createElement("option");
      o.value = t;
      o.textContent = t;
      obsTipo.appendChild(o);
    }

    // opción Otra
    const o = document.createElement("option");
    o.value = "_OTRA";
    o.textContent = "Otra (escribir abajo)";
    obsTipo.appendChild(o);

    // intentar restaurar selección si aún existe
    if ([...obsTipo.options].some((x) => x.value === current)) {
      obsTipo.value = current;
    } else {
      obsTipo.value = "";
    }
  }

  // --- Helpers ---
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setNotice(html) {
    notice.innerHTML = html;
  }

  function chipTipoClass(t) {
    if (t === "TARDE") return "tipo-tarde";
    if (t === "CONVIVENCIA") return "tipo-convivencia";
    return "tipo-inasistencia";
  }

  function nivelLabel(n) {
    if (n === "TIPO_I") return "Tipo I";
    if (n === "TIPO_II") return "Tipo II";
    if (n === "TIPO_III") return "Tipo III";
    if (n === "LEVE") return "Tipo I";
    if (n === "MODERADO") return "Tipo II";
    if (n === "GRAVE") return "Tipo III";
    return n || "";
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function toCSVRow(fields) {
    return fields
      .map((f) => {
        const s = String(f ?? "");
        const needs = /[",\n]/.test(s);
        const esc = s.replaceAll('"', '""');
        return needs ? `"${esc}"` : esc;
      })
      .join(",");
  }

  // --- Scan ---
  async function startScan() {
    formEvento.style.display = "none";
    qrReader.style.display = "block";
    cancelScanBtn.style.display = "inline-block";
    setNotice(`<strong>Escaneando...</strong><br><span class="small">Apunta la cámara al código QR.</span>`);

    // Regla de oro: no tocamos nada del flujo que ya funciona
    if (!qrScanner) qrScanner = new Html5Qrcode("qr-reader");

    try {
      await qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (codigoQR) => {
          try { await qrScanner.stop(); } catch {}
          qrReader.style.display = "none";
          cancelScanBtn.style.display = "none";

          const a = new Date();
          pending = {
            codigo: codigoQR,
            fecha: a.toLocaleDateString(),
            hora: a.toLocaleTimeString(),
            fechaISO: a.toISOString().slice(0, 10),
            timestamp: a.toISOString(),
            tipo: "INASISTENCIA",
            excusa: null,
            nivel: null,
            obs: ""
          };

          codigoActual.textContent = `Código: ${codigoQR}`;
          horaActual.textContent = `Hora: ${pending.fecha} • ${pending.hora}`;

          tipo.value = "INASISTENCIA";
          excusa.value = "SIN_EXCUSA";
          nivel.value = "TIPO_I";
          obs.value = "";
          buildObsTipoOptions();
          obsTipo.value = "";
          updateFormByTipo();

          setNotice(`<strong>QR leído:</strong> ${escapeHtml(codigoQR)}<br><span class="small">Clasifica y guarda.</span>`);
          formEvento.style.display = "block";
        }
      );
    } catch (e) {
      qrReader.style.display = "none";
      cancelScanBtn.style.display = "none";
      setNotice(`<strong>No se pudo iniciar la cámara.</strong><br><span class="small">Revisa permisos del navegador.</span>`);
    }
  }

  async function cancelScan() {
    try { await qrScanner?.stop(); } catch {}
    qrReader.style.display = "none";
    cancelScanBtn.style.display = "none";
    setNotice(`<strong>Escaneo cancelado.</strong> Presiona <em>Escanear QR</em> para intentarlo de nuevo.`);
  }

  // --- Form behavior ---
  function updateFormByTipo() {
    const t = tipo.value;

    // Excusa aplica para INASISTENCIA y TARDE
    const needsExcusa = (t === "INASISTENCIA" || t === "TARDE");
    wrapExcusa.style.display = needsExcusa ? "grid" : "none";

    // Clasificación (Tipo I/II/III) solo aplica para CONVIVENCIA
    const needsNivel = (t === "CONVIVENCIA");
    wrapNivel.style.display = needsNivel ? "grid" : "none";

    // Observación tipo solo para TARDE
    wrapObsTipo.style.display = (t === "TARDE") ? "grid" : "none";

    // Cada vez que entras a TARDE, refresca opciones por si ya agregaste nuevas
    if (t === "TARDE") buildObsTipoOptions();
  }

  tipo.addEventListener("change", updateFormByTipo);

  // Observación tipo: si seleccionas una opción (no "Otra"), se copia a la observación
  obsTipo.addEventListener("change", () => {
    const v = obsTipo.value;
    if (!v) return;
    if (v === "_OTRA") {
      obs.focus();
      return;
    }
    obs.value = v;
  });

  function guardarEvento() {
    if (!pending) {
      setNotice(`<strong>Primero escanea un QR.</strong>`);
      return;
    }

    pending.tipo = tipo.value;
    pending.obs = obs.value.trim();

    if (pending.tipo === "INASISTENCIA" || pending.tipo === "TARDE") {
      pending.excusa = excusa.value;
      pending.nivel = null;
    } else if (pending.tipo === "CONVIVENCIA") {
      pending.nivel = nivel.value;
      pending.excusa = null;
    }

    // Si es TARDE y escribió una observación nueva, guardarla para el futuro
    if (pending.tipo === "TARDE") {
      const saved = addCustomObsIfNeeded(pending.obs);
      if (saved) buildObsTipoOptions();
    }

    addRegistro(pending);
    setNotice(`<strong>Guardado.</strong> Puedes escanear el siguiente QR.`);
    pending = null;
    formEvento.style.display = "none";
    codigoActual.textContent = "Código: —";
    horaActual.textContent = "Hora: —";
  }

  function exportarCSV() {
    const arr = getRegistros();
    const header = [
      "timestamp",
      "fechaISO",
      "fecha",
      "hora",
      "codigo",
      "tipo",
      "excusa",
      "clasificacion",
      "observacion"
    ];
    const rows = [toCSVRow(header)];
    for (const r of arr.slice().reverse()) {
      rows.push(
        toCSVRow([
          r.timestamp,
          r.fechaISO,
          r.fecha,
          r.hora,
          r.codigo,
          r.tipo,
          r.excusa || "",
          r.nivel || "",
          r.obs || ""
        ])
      );
    }
    const now = new Date().toISOString().slice(0, 10);
    downloadText(`registros_qr_${now}.csv`, rows.join("\n"));
  }

  function renderRegistros() {
    const arr = getRegistros();
    totalReg.textContent = String(arr.length);

    if (!arr.length) {
      historial.innerHTML = `<div class="empty">Aún no hay registros.</div>`;
      return;
    }

    const html = arr
      .slice(0, 200)
      .map((r) => {
        const chips = [];
        chips.push(`<span class="chip ${chipTipoClass(r.tipo)}">${escapeHtml(r.tipo)}</span>`);

        if ((r.tipo === "INASISTENCIA" || r.tipo === "TARDE") && r.excusa) {
          chips.push(`<span class="chip">${r.excusa === "CON_EXCUSA" ? "Con excusa" : "Sin excusa"}</span>`);
        }

        if (r.tipo === "CONVIVENCIA" && r.nivel) {
          chips.push(`<span class="chip">${escapeHtml(nivelLabel(r.nivel))}</span>`);
        }

        const obsHtml = r.obs ? `<div class="obs">${escapeHtml(r.obs)}</div>` : "";

        return `
          <div class="item">
            <div class="item-top">
              <div class="chips">${chips.join("")}</div>
              <div class="when">${escapeHtml(r.fecha)} • ${escapeHtml(r.hora)}</div>
            </div>
            <div class="code">${escapeHtml(r.codigo)}</div>
            ${obsHtml}
          </div>
        `;
      })
      .join("");

    historial.innerHTML = html;
  }

  // --- Bindings ---
  scanBtn.addEventListener("click", startScan);
  cancelScanBtn.addEventListener("click", cancelScan);
  guardarBtn.addEventListener("click", guardarEvento);
  limpiarBtn.addEventListener("click", () => {
    if (confirm("¿Seguro que deseas borrar todos los registros guardados en este dispositivo?")) {
      clearRegistros();
      setNotice(`<strong>Registros borrados.</strong>`);
    }
  });
  exportarBtn.addEventListener("click", exportarCSV);

  // --- Init ---
  buildObsTipoOptions();
  renderRegistros();
  updateFormByTipo();
});
