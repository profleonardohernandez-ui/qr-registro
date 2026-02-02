document.addEventListener("DOMContentLoaded", () => {
  // --- UI ---
  const scanBtn = document.getElementById("scanBtn");
  const cancelScanBtn = document.getElementById("cancelScanBtn");
  const guardarBtn = document.getElementById("guardarBtn");

  const syncBtn = document.getElementById("syncBtn"); // Sync
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

  const wrapFalta = document.getElementById("wrapFalta");
  const falta = document.getElementById("falta");
  const wrapFaltaOtra = document.getElementById("wrapFaltaOtra");
  const faltaOtra = document.getElementById("faltaOtra");

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

  // === PASO 3: Contexto de sesión (solo LOCAL + CSV + HISTORIAL) ===
  const KEY_CTX = "qr_contexto_sesion_v1";

  // Horario real (54 min por hora-clase). Descanso y almuerzo NO se manejan como bloques.
  const BLOQUE_T0_24H = {
    "1": "07:00:00",
    "2": "07:54:00",
    "3": "08:48:00",
    "4": "09:52:00",
    "5": "10:46:00",
    "6": "12:06:00",
    "7": "13:00:00",
    "8": "13:54:00",
  };

  const BLOQUE_LABEL = {
    "1": "1° (07:00 - 07:54)",
    "2": "2° (07:54 - 08:48)",
    "3": "3° (08:48 - 09:42)",
    "4": "4° (09:52 - 10:46)",
    "5": "5° (10:46 - 11:40)",
    "6": "6° (12:06 - 13:00)",
    "7": "7° (13:00 - 13:54)",
    "8": "8° (13:54 - 14:48)",
  };

  // === Google Sheets Sync ===
  const SHEETS_WEBAPP_URL =
    "https://script.google.com/macros/s/AKfycbzbbTA4VFxI8hv2qNqZWaBgMOwrc22lmf1-MSv7Y5uf_gey96Fxbz_HJC2vP-7TO6s/exec";
  const KEY_DEVICE_ID = "qr_device_id_v1";

  // ✅ Coherencia con index.html (texto corto)
  const SYNC_BTN_LABEL = "☁️ Sincronizar GS";

  // Observaciones tipo (Llegada tarde)
  const KEY_OBS_TARDE = "obs_tipos_tarde_v1";
  const OBS_TARDE_DEFAULT = [
    "Estaba comprando en la tienda",
    "No escuché el timbre",
    "Se me olvidó",
    "Estaba con otro profesor",
  ];

  // Faltas Convivencia
  const KEY_FALTAS_PREFIX = "faltas_convivencia_v1_";
  const FALTAS_DEFAULT = {
    TIPO_I: [
      "I.1 Daño/uso indebido de útiles y materiales",
      "I.2 Ingreso a aula/espacios sin permiso",
      "I.3 Conductas de riesgo en instalaciones",
      "I.4 Retener/ocultar comunicados a acudientes",
      "I.5 Ventas/colectas/apuestas dentro del colegio",
      "I.6 Irrespeto o conducta inadecuada",
      "I.7 Uniforme: uso/porte inadecuada",
      "I.8 Celular/tecnología: uso indebido en clase",
      "I.9 Incumplimiento académico reiterado",
      "I.10 Evasión/retardo/inasistencia injustificada",
      "I.11 Lenguaje soez o denigrante",
      "I.12 Agresión digital (mensajes/memes ofensivos)",
      "I.13 Lenguaje/gestos sexuales inapropiados",
      "I.14 Discriminación por género/orientación sexual",
      "I.15 Daño a zonas verdes/corredores ecológicos",
    ],
    TIPO_II: [
      "II.1 Reincidencia en Tipo I con agresión",
      "II.2 Entrada/salida sin autorización",
      "II.3 Interrumpir clase con violencia",
      "II.4 Irrespeto físico a miembros",
      "II.5 Acoso sexual/discriminación (incl. digital)",
      "II.6 Juegos violentos/peligrosos",
      "II.7 Portar/consumir cigarrillo, vaper o SPA",
      "II.8 Llegar bajo efectos de alcohol/SPA",
      "II.9 Consultar/traer pornografía o violencia",
      "II.10 Hostigamiento sistemático (insistencia/mensajes)",
    ],
    TIPO_III: [
      "III.1 Agresión física con incapacidad",
      "III.2 Hurto/abuso de confianza",
      "III.3 Agresión verbal/moral grave",
      "III.4 Sabotaje/protesta violenta",
      "III.5 Injuria/calumnia/publicación deshonrosa",
      "III.6 Portar armas/objetos peligrosos",
      "III.7 Atentar contra salud/integridad",
      "III.8 Fraude/copia/plagio/falsificación",
      "III.9 Plagio/derechos de autor",
      "III.10 Daño intencional a muebles/equipos",
      "III.11 Licor/SPA: poseer/vender/inducir",
      "III.12 Delitos sexuales/DHSSR (identidad/orientación)",
      "III.13 Usar nombre del colegio sin permiso",
      "III.14 Divulgar fotos comprometedoras sin permiso",
      "III.15 Publicar mensajes/fotos/videos sin permiso",
    ],
  };

  function safeParseJSON(raw, fallback) {
    try {
      const v = JSON.parse(raw);
      return v ?? fallback;
    } catch {
      return fallback;
    }
  }

  function norm(s) {
    return String(s || "").trim().toLowerCase();
  }

  function uniq(list) {
    const out = [];
    const seen = new Set();
    for (const x of list) {
      const k = norm(x);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(String(x).trim());
    }
    return out;
  }

  function loadList(key, fallbackArr) {
    const raw = localStorage.getItem(key);
    const arr = raw ? safeParseJSON(raw, []) : [];
    if (Array.isArray(arr) && arr.length) return uniq(arr);
    return uniq(fallbackArr);
  }

  function saveList(key, arr) {
    localStorage.setItem(key, JSON.stringify(uniq(arr)));
  }

  function pushUniqueAndSave(key, currentList, value) {
    const v = String(value || "").trim();
    if (!v) return currentList;
    const merged = uniq([...currentList, v]);
    saveList(key, merged);
    return merged;
  }

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
        falta: r.falta || "",
        obs: r.obs || "",
        syncedAt: r.syncedAt || "",

        asignatura: r.asignatura || "",
        bloqueInicio: r.bloqueInicio || "",
        bloqueLabel: r.bloqueLabel || "",
        horaInicioBloque: r.horaInicioBloque || "",
        contextoUpdatedAt: r.contextoUpdatedAt || "",
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

  let obsTardeList = loadList(KEY_OBS_TARDE, OBS_TARDE_DEFAULT);

  function refreshObsTipoOptions() {
    if (!obsTipo) return;
    const current = obsTipo.value;

    const all = uniq([...OBS_TARDE_DEFAULT, ...obsTardeList]);
    obsTipo.innerHTML = "";

    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "— seleccionar —";
    obsTipo.appendChild(opt0);

    for (const item of all) {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      obsTipo.appendChild(opt);
    }

    const optOther = document.createElement("option");
    optOther.value = "_OTRA";
    optOther.textContent = "Otra (escribir abajo)";
    obsTipo.appendChild(optOther);

    if ([...obsTipo.options].some((o) => o.value === current)) {
      obsTipo.value = current;
    } else {
      obsTipo.value = "";
    }
  }

  function faltasKeyByNivel(n) {
    return `${KEY_FALTAS_PREFIX}${n || "TIPO_I"}`;
  }

  function loadFaltasByNivel(n) {
    const base = FALTAS_DEFAULT[n] || [];
    return loadList(faltasKeyByNivel(n), base);
  }

  let faltasList = {
    TIPO_I: loadFaltasByNivel("TIPO_I"),
    TIPO_II: loadFaltasByNivel("TIPO_II"),
    TIPO_III: loadFaltasByNivel("TIPO_III"),
  };

  function refreshFaltaOptions() {
    if (!falta) return;
    const n = nivel?.value || "TIPO_I";
    const current = falta.value;

    const list = faltasList[n] || [];
    falta.innerHTML = "";

    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "— seleccionar —";
    falta.appendChild(opt0);

    for (const item of list) {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      falta.appendChild(opt);
    }

    const optOther = document.createElement("option");
    optOther.value = "_OTRA";
    optOther.textContent = "Otra (guardar nueva)";
    falta.appendChild(optOther);

    if ([...falta.options].some((o) => o.value === current)) {
      falta.value = current;
    } else {
      falta.value = "";
    }

    refreshFaltaOtraUI();
  }

  function refreshFaltaOtraUI() {
    if (!wrapFaltaOtra || !faltaOtra) return;
    const show = falta?.value === "_OTRA";
    wrapFaltaOtra.style.display = show ? "grid" : "none";
    if (!show) faltaOtra.value = "";
  }

  function getDeviceId() {
    let id = localStorage.getItem(KEY_DEVICE_ID);
    if (id) return id;

    const rnd = () => Math.floor(Math.random() * 1e9).toString(36);
    id = `DEV-${rnd()}-${rnd()}-${Date.now().toString(36)}`;
    localStorage.setItem(KEY_DEVICE_ID, id);
    return id;
  }

  function makeUid(r) {
    return `${r.timestamp || ""}__${r.codigo || ""}__${r.tipo || ""}`;
  }

  async function syncToGoogleSheets() {
    if (!navigator.onLine) {
      setNotice(
        `<strong>Sin internet.</strong><br><span class="small">Conéctate y vuelve a intentar.</span>`
      );
      return;
    }

    const all = getRegistros();
    const pendingSync = all.filter((r) => !r.syncedAt);

    if (!pendingSync.length) {
      setNotice(
        `<strong>Ya está todo sincronizado.</strong><br><span class="small">No hay registros pendientes.</span>`
      );
      return;
    }

    const exportedAt = new Date().toISOString();
    const deviceId = getDeviceId();

    // ✅ FIX CRÍTICO: incluir CONTEXTO en el payload (coherente con Código.gs)
    const records = pendingSync.map((r) => ({
      uid: makeUid(r),
      timestamp: r.timestamp || "",
      fechaISO: r.fechaISO || "",
      fecha: r.fecha || "",
      hora: r.hora || "",
      codigo: r.codigo || "",
      tipo: r.tipo || "",
      excusa: r.excusa || "",
      nivel: r.nivel || "",
      falta: r.falta || "",
      obs: r.obs || "",

      // === CONTEXTO ===
      asignatura: r.asignatura || "",
      bloqueInicio: r.bloqueInicio || "",
      bloqueLabel: r.bloqueLabel || "",
      horaInicioBloque: r.horaInicioBloque || "",
      contextoUpdatedAt: r.contextoUpdatedAt || "",
    }));

    if (syncBtn) {
      syncBtn.disabled = true;
      syncBtn.textContent = "☁️ Sincronizando...";
    }
    setNotice(
      `<strong>Sincronizando...</strong><br><span class="small">Pendientes: ${pendingSync.length}</span>`
    );

    try {
      const res = await fetch(SHEETS_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ deviceId, exportedAt, records }),
      });

      const txt = await res.text();
      let out = null;
      try {
        out = JSON.parse(txt);
      } catch {
        out = null;
      }

      if (!out || out.ok !== true) {
        throw new Error(out && out.error ? out.error : "No se pudo confirmar respuesta de Google");
      }

      const uids = new Set(records.map((x) => x.uid));
      const enviados = pendingSync.length;

      const borrar = confirm(
        `✅ Sincronización confirmada.\n\n¿Borrar del dispositivo los ${enviados} registros enviados?\n(Recomendado para dejar el celular limpio)`
      );

      if (borrar) {
        const remaining = all.filter((r) => !uids.has(makeUid(r)));
        setRegistros(remaining);
        renderRegistros();
        setNotice(
          `<strong>Sincronización completa.</strong><br>` +
            `<span class="small">Enviados: ${out.received} • Nuevos: ${out.appended} • Duplicados: ${out.duplicates} • Borrados local: ${enviados}</span>`
        );
      } else {
        const syncedAt = new Date().toISOString();
        const updated = all.map((r) => {
          const uid = makeUid(r);
          if (!r.syncedAt && uids.has(uid)) return { ...r, syncedAt };
          return r;
        });
        setRegistros(updated);
        renderRegistros();
        setNotice(
          `<strong>Sincronización completa.</strong><br>` +
            `<span class="small">Enviados: ${out.received} • Nuevos: ${out.appended} • Duplicados: ${out.duplicates} • Guardados local: Sí</span>`
        );
      }
    } catch (err) {
      setNotice(
        `<strong>No se pudo confirmar la sincronización.</strong><br>` +
          `<span class="small">${escapeHtml(
            String(err && err.message ? err.message : err)
          )}</span><br>` +
          `<span class="small">Abre el Sheet y verifica si llegaron filas. Puedes reintentar: no se duplicará.</span>`
      );
    } finally {
      if (syncBtn) {
        syncBtn.disabled = false;
        // ✅ Coherente con index.html
        syncBtn.textContent = SYNC_BTN_LABEL;
      }
    }
  }

  function normalizeBloqueValue(v) {
    const s = String(v ?? "").trim();
    const m = s.match(/(\d+)/);
    return m ? m[1] : "";
  }

  function getContextoSesion() {
    const selAsig = document.getElementById("contextoClase");
    const selBloq = document.getElementById("horaClaseInicio");

    const domAsig =
      selAsig && typeof selAsig.value === "string" ? selAsig.value.trim() : "";
    const domBloqRaw =
      selBloq && typeof selBloq.value === "string" ? selBloq.value.trim() : "";
    const domBloq = normalizeBloqueValue(domBloqRaw);

    let domBloqLabel = "";
    if (selBloq && selBloq.options && selBloq.selectedIndex >= 0) {
      domBloqLabel = (selBloq.options[selBloq.selectedIndex] || {}).textContent || "";
      domBloqLabel = String(domBloqLabel || "").trim();
    }

    const raw = localStorage.getItem(KEY_CTX);
    const ctx = raw ? safeParseJSON(raw, null) : null;

    const lsAsigRaw =
      ctx && typeof ctx.asignatura === "string"
        ? ctx.asignatura
        : ctx && typeof ctx.contextoClase === "string"
        ? ctx.contextoClase
        : "";

    const lsBloqRaw =
      ctx && (typeof ctx.bloque === "string" || typeof ctx.bloque === "number")
        ? ctx.bloque
        : ctx && (typeof ctx.bloqueInicio === "string" || typeof ctx.bloqueInicio === "number")
        ? ctx.bloqueInicio
        : ctx && (typeof ctx.horaClaseInicio === "string" || typeof ctx.horaClaseInicio === "number")
        ? ctx.horaClaseInicio
        : "";

    const lsAsig = String(lsAsigRaw || "").trim();
    const lsBloq = normalizeBloqueValue(lsBloqRaw);

    const lsUpdatedAt =
      ctx && typeof ctx.updatedAt === "string"
        ? ctx.updatedAt
        : ctx && typeof ctx.contextoUpdatedAt === "string"
        ? ctx.contextoUpdatedAt
        : "";

    const asignatura = domAsig || lsAsig || "";
    const bloqueInicio = domBloq || lsBloq || "";

    let bloqueLabel = domBloqLabel || "";
    if (!bloqueLabel && ctx && typeof ctx.bloqueLabel === "string") {
      bloqueLabel = ctx.bloqueLabel.trim();
    }
    if (!bloqueLabel && bloqueInicio) {
      bloqueLabel = BLOQUE_LABEL[bloqueInicio] || `${bloqueInicio}°`;
    }

    const horaInicioBloque = BLOQUE_T0_24H[bloqueInicio] || "";
    const contextoUpdatedAt = lsUpdatedAt || "";

    // ✅ Persistencia defensiva SIN romper el candado:
    // preserva propiedades existentes (ej. "locked") en KEY_CTX
    if (domAsig && domBloq) {
      try {
        const prevRaw = localStorage.getItem(KEY_CTX);
        const prev = prevRaw ? safeParseJSON(prevRaw, {}) : {};
        localStorage.setItem(
          KEY_CTX,
          JSON.stringify({
            ...(prev && typeof prev === "object" ? prev : {}),
            asignatura: domAsig,
            bloque: domBloq,
            bloqueLabel:
              domBloqLabel ||
              (domBloq ? (BLOQUE_LABEL[domBloq] || `${domBloq}°`) : ""),
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }

    return { asignatura, bloqueInicio, bloqueLabel, horaInicioBloque, contextoUpdatedAt };
  }

  function inyectarContextoEnRegistro(reg) {
    const c = getContextoSesion();
    reg.asignatura = c.asignatura || "-";
    reg.bloqueInicio = c.bloqueInicio || "";
    reg.bloqueLabel = c.bloqueLabel || (reg.bloqueInicio ? `${reg.bloqueInicio}°` : "");
    reg.horaInicioBloque = c.horaInicioBloque || "";
    reg.contextoUpdatedAt = c.contextoUpdatedAt || "";
    return reg;
  }

  async function startScan() {
    formEvento.style.display = "none";
    qrReader.style.display = "block";
    cancelScanBtn.style.display = "inline-block";
    setNotice(
      `<strong>Escaneando...</strong><br><span class="small">Apunta la cámara al código QR.</span>`
    );

    if (!qrScanner) qrScanner = new Html5Qrcode("qr-reader");

    try {
      await qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (codigoQR) => {
          try {
            await qrScanner.stop();
          } catch {}
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
            falta: "",
            obs: "",
            syncedAt: "",

            asignatura: "",
            bloqueInicio: "",
            bloqueLabel: "",
            horaInicioBloque: "",
            contextoUpdatedAt: "",
          };

          inyectarContextoEnRegistro(pending);

          codigoActual.textContent = `Código: ${codigoQR}`;
          horaActual.textContent = `Hora: ${pending.fecha} • ${pending.hora}`;

          tipo.value = "INASISTENCIA";
          if (excusa) excusa.value = "SIN_EXCUSA";
          if (nivel) nivel.value = "TIPO_I";
          if (falta) falta.value = "";
          if (faltaOtra) faltaOtra.value = "";
          if (obsTipo) obsTipo.value = "";
          if (obs) obs.value = "";

          refreshObsTipoOptions();
          refreshFaltaOptions();
          updateFormByTipo();

          setNotice(
            `<strong>QR leído:</strong> ${escapeHtml(
              codigoQR
            )}<br><span class="small">Clasifica y guarda.</span>`
          );
          formEvento.style.display = "block";
        }
      );
    } catch {
      qrReader.style.display = "none";
      cancelScanBtn.style.display = "none";
      setNotice(
        `<strong>No se pudo iniciar la cámara.</strong><br><span class="small">Revisa permisos del navegador.</span>`
      );
    }
  }

  async function cancelScan() {
    try {
      await qrScanner?.stop();
    } catch {}
    qrReader.style.display = "none";
    cancelScanBtn.style.display = "none";
    setNotice(
      `<strong>Escaneo cancelado.</strong> Presiona <em>Escanear QR</em> para intentarlo de nuevo.`
    );
  }

  function updateFormByTipo() {
    const t = tipo.value;

    const needsExcusa = t === "INASISTENCIA" || t === "TARDE";
    wrapExcusa.style.display = needsExcusa ? "grid" : "none";

    const isConvivencia = t === "CONVIVENCIA";
    wrapNivel.style.display = isConvivencia ? "grid" : "none";
    wrapFalta.style.display = isConvivencia ? "grid" : "none";
    if (isConvivencia) {
      refreshFaltaOptions();
    } else {
      if (wrapFaltaOtra) wrapFaltaOtra.style.display = "none";
    }

    wrapObsTipo.style.display = t === "TARDE" ? "grid" : "none";
  }

  tipo?.addEventListener("change", updateFormByTipo);

  nivel?.addEventListener("change", () => {
    refreshFaltaOptions();
  });

  falta?.addEventListener("change", () => {
    refreshFaltaOtraUI();
    if (falta.value === "_OTRA") {
      faltaOtra?.focus();
    }
  });

  obsTipo?.addEventListener("change", () => {
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
      pending.falta = "";

      if (pending.tipo === "TARDE" && obsTipo?.value === "_OTRA") {
        const nueva = (obs.value || "").trim();
        if (nueva) {
          obsTardeList = pushUniqueAndSave(KEY_OBS_TARDE, obsTardeList, nueva);
          refreshObsTipoOptions();
        }
      }
    } else if (pending.tipo === "CONVIVENCIA") {
      pending.nivel = nivel.value;
      pending.excusa = null;

      if (falta.value === "_OTRA") {
        const nuevaFalta = (faltaOtra?.value || "").trim();
        pending.falta = nuevaFalta;

        if (nuevaFalta) {
          const n = pending.nivel || "TIPO_I";
          const k = faltasKeyByNivel(n);
          const updated = pushUniqueAndSave(k, faltasList[n] || [], nuevaFalta);
          faltasList[n] = updated;
          refreshFaltaOptions();
        }
      } else {
        pending.falta = falta.value || "";
      }
    } else {
      pending.excusa = null;
      pending.nivel = null;
      pending.falta = "";
    }

    inyectarContextoEnRegistro(pending);

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
      "falta",
      "observacion",
      "syncedAt",
      "asignatura",
      "bloqueInicio",
      "bloqueLabel",
      "horaInicioBloque",
      "contextoUpdatedAt",
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
          r.falta || "",
          r.obs || "",
          r.syncedAt || "",
          r.asignatura || "",
          r.bloqueInicio || "",
          r.bloqueLabel || "",
          r.horaInicioBloque || "",
          r.contextoUpdatedAt || "",
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

        const asig = r.asignatura || "";
        const bloq = r.bloqueInicio || "";
        const bloqLabel = r.bloqueLabel || "";
        const t0 = r.horaInicioBloque || "";

        if (asig && asig !== "-") {
          chips.push(`<span class="chip">${escapeHtml(asig)}</span>`);
        }
        if (bloqLabel || bloq) {
          const txt = bloqLabel || `${bloq}°`;
          chips.push(`<span class="chip">Inicio: ${escapeHtml(txt)}</span>`);
        }
        if (t0) {
          chips.push(`<span class="chip">T0: ${escapeHtml(t0)}</span>`);
        }

        chips.push(
          `<span class="chip ${chipTipoClass(r.tipo)}">${escapeHtml(r.tipo)}</span>`
        );

        if ((r.tipo === "INASISTENCIA" || r.tipo === "TARDE") && r.excusa) {
          chips.push(
            `<span class="chip">${
              r.excusa === "CON_EXCUSA" ? "Con excusa" : "Sin excusa"
            }</span>`
          );
        }

        if (r.tipo === "CONVIVENCIA" && r.nivel) {
          chips.push(`<span class="chip">${escapeHtml(nivelLabel(r.nivel))}</span>`);
        }

        if (r.tipo === "CONVIVENCIA" && r.falta) {
          chips.push(`<span class="chip">${escapeHtml(r.falta)}</span>`);
        }

        if (r.syncedAt) {
          chips.push(`<span class="chip">☁️ Sync</span>`);
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

  scanBtn?.addEventListener("click", startScan);
  cancelScanBtn?.addEventListener("click", cancelScan);
  guardarBtn?.addEventListener("click", guardarEvento);

  syncBtn?.addEventListener("click", syncToGoogleSheets);

  limpiarBtn?.addEventListener("click", () => {
    if (confirm("¿Seguro que deseas borrar todos los registros guardados en este dispositivo?")) {
      clearRegistros();
      setNotice(`<strong>Registros borrados.</strong>`);
    }
  });

  exportarBtn?.addEventListener("click", exportarCSV);

  refreshObsTipoOptions();
  refreshFaltaOptions();
  renderRegistros();
  updateFormByTipo();
});
