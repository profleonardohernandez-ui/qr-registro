document.addEventListener("DOMContentLoaded", () => {
  // --- UI ---
  const scanBtn = document.getElementById("scanBtn");
  const cancelScanBtn = document.getElementById("cancelScanBtn");
  const guardarBtn = document.getElementById("guardarBtn");

  const syncBtn = document.getElementById("syncBtn"); // NUEVO
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

  // === Google Sheets Sync ===
  const SHEETS_WEBAPP_URL =
    "https://script.google.com/macros/s/AKfycbzbbTA4VFxI8hv2qNqZWaBgMOwrc22lmf1-MSv7Y5uf_gey96Fxbz_HJC2vP-7TO6s/exec";
  const KEY_DEVICE_ID = "qr_device_id_v1";

  // Observaciones tipo (Llegada tarde) — por defecto + personalizadas
  const KEY_OBS_TARDE = "obs_tipos_tarde_v1";
  const OBS_TARDE_DEFAULT = [
    "Estaba comprando en la tienda",
    "No escuché el timbre",
    "Se me olvidó",
    "Estaba con otro profesor",
  ];

  // Faltas Convivencia (Manual) + personalizadas por nivel
  const KEY_FALTAS_PREFIX = "faltas_convivencia_v1_";
  const FALTAS_DEFAULT = {
    TIPO_I: [
      "I.1 Maltratar o hacer uso inadecuado de los útiles escolares tanto propios como ajenos, incluyendo materiales deportivos y zonas de uso común.",
      "I.2 Ingresar al aula y/o espacios de la institución sin autorización.",
      "I.3 Hacer uso inadecuado de las instalaciones de la institución, con prácticas que ponen en riesgo su integridad física y la de los demás miembros de la comunidad educativa.",
      "I.4 Conservar y/o retener información, comunicados o circulares dirigidas a padres de familia o acudientes.",
      "I.5 Comerciar, hacer colectas, apuestas, rifas y demás similares, dentro de la institución, so pena de incurrir en un delito como consecuencia del incumplimiento.",
      "I.6 Presentar un comportamiento inadecuado e irrespetuoso dentro de las instalaciones de la institución educativa.",
      "I.7 Hacer uso inadecuado o portar de forma inapropiada dentro y fuera de la institución educativa el uniforme.",
      "I.8 El uso inadecuado del teléfono celular y/o elementos tecnológicos dentro de la clase.",
      "I.9 Incumplir de forma reiterada con sus compromisos académicos y/o actividades de recuperación a las que tenga derecho.",
      "I.10 La evasión, el retardo, inasistencia o no participación, sin causa justa de las actividades académicas y/o pedagógicas programadas por la institución educativa.",
      "I.11 Usar un vocabulario soez, descalificativo, denigrante o que atente contra la dignidad de cualquier miembro de la comunidad educativa.",
      "I.12 Agresiones digitales, mensajes, memes, stickers, imágenes o correos electrónicos insultantes u ofensivos, que buscan afectar negativamente a la otra persona.",
      "I.13 Uso de gestos o vocabulario irrespetuoso con connotación sexual.",
      "I.14 Excluir o señalar por razones de género u orientación sexual a cualquier miembro de la comunidad educativa.",
      "I.15 Dañar las zonas verdes de la Institución o corredores ecológicos de la Institución.",
    ],
    TIPO_II: [
      "II.1 Reincidencia, en una falta leve (tipo I) que implique cualquier tipo de agresión.",
      "II.2 Ingresar y/o salir de la institución sin autorización.",
      "II.3 Perturbar el normal desarrollo de las clases con acciones violentas.",
      "II.4 Irrespetar físicamente a los integrantes de la comunidad educativa.",
      "II.5 Agresiones repetitivas de forma física, escritas y verbales, con contenido sexual, incluyendo aquellas que discriminen por su orientación sexual usando medios tecnológicos (redes sociales, email, blog, páginas de internet, etc.).",
      "II.6 Participar y fomentar en juegos violentos que atenten contra la integridad física o dignidad de la persona.",
      "II.7 Consumir o portar cigarrillos, vaper y/o sustancias psicoactivas dentro de la Institución Educativa.",
      "II.8 Presentarse en la institución Educativa en estado de embriaguez o bajo los efectos de sustancias que alteran su estado de conciencia.",
      "II.9 Traer y/o consultar páginas web que promuevan la pornografía y la violencia.",
      "II.10 Perturbar de forma sistemática e insistente a cualquier miembro de la comunidad con mensajes escritos o verbales que agredan su dignidad.",
    ],
    TIPO_III: [
      "III.1 Las agresiones físicas con la intención de causar daño a compañeros, profesores, directivos, administrativos y demás miembros de la comunidad educativa, cuando el hecho se efectúe dentro de las instalaciones del plantel o en actividades programadas en otros lugares y generen incapacidad, calificada por legista.",
      "III.2 Apropiarse de objetos sin el consentimiento del propietario; en calidad de hurto o abuso de confianza.",
      "III.3 Agredir física, verbal o moralmente a cualquier miembro de la comunidad educativa.",
      "III.4 Participar o propiciar enfrentamientos, sabotajes y protestas violentas contra cualquier miembro de la comunidad educativa.",
      "III.5 Participar o propiciar enfrentamientos, haciendo imputaciones deshonrosas, imputando falsamente una conducta típica o repitiera publicaciones o reproduciendo injuria o calumnia.",
      "III.6 Portar armas u objetos que atenten contra la integridad física de cualquier miembro de la comunidad educativa.",
      "III.7 Intentar hacer daño al cuerpo o salud de cualquier miembro de la comunidad educativa.",
      "III.8 Hacer fraude, copia, intento de copia, plagio en las evaluaciones o trabajos, colusión, adulteración de calificaciones o falsificación de firmas.",
      "III.9 Presentar trabajos como propios sin reconocer las fuentes citadas o que hayan sido elaborados por otras personas, violar las normas de derechos de autor.",
      "III.10 Dañar intencionalmente los muebles, instalaciones o equipos de la institución, o de los miembros de la comunidad educativa.",
      "III.11 Poseer, comprar, vender, ingerir o inducir a otro al consumo de licor o cualquier sustancia psicoactiva dentro de la institución, en el transporte escolar o en actividades que realice la institución fuera de sus instalaciones.",
      "III.12 Participar en situaciones que afectan los Derechos humanos sexuales y reproductivos, como son los delitos contra la libertad, la integridad, la identidad de género y la orientación sexual.",
      "III.13 Utilizar el nombre de la institución, sin autorización, para obtener beneficios personales.",
      "III.14 Divulgación de fotos comprometedoras para el estudiante sin su previo consentimiento.",
      "III.15 Publicación de mensajes, fotos, vídeos, sin consentimiento de la persona.",
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
        syncedAt: r.syncedAt || "", // NUEVO
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

  // --- Dynamic options (ObsTipo / Faltas) ---
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

  // === Google Sheets Sync helpers ===
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
    }));

    // UI lock
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

      // Intentar leer respuesta (si el navegador permite CORS)
      const txt = await res.text();
      let out = null;
      try {
        out = JSON.parse(txt);
      } catch {
        out = null;
      }

      if (!out || out.ok !== true) {
        // Nota: a veces el envío sí llega pero el navegador bloquea leer respuesta.
        throw new Error(out && out.error ? out.error : "No se pudo confirmar respuesta de Google");
      }

      // Marcar como sincronizados SOLO si confirmamos OK
      const syncedAt = new Date().toISOString();
      const uids = new Set(records.map((x) => x.uid));

      const updated = all.map((r) => {
        const uid = makeUid(r);
        if (!r.syncedAt && uids.has(uid)) return { ...r, syncedAt };
        return r;
      });

      setRegistros(updated);
      renderRegistros();

      setNotice(
        `<strong>Sincronización completa.</strong><br>` +
          `<span class="small">Enviados: ${out.received} • Nuevos: ${out.appended} • Duplicados: ${out.duplicates}</span>`
      );
    } catch (err) {
      // No marcamos syncedAt si no pudimos confirmar.
      setNotice(
        `<strong>Envío realizado, pero NO se pudo confirmar.</strong><br>` +
          `<span class="small">${escapeHtml(
            String(err && err.message ? err.message : err)
          )}</span><br>` +
          `<span class="small">Abre el Sheet y verifica si llegaron filas. Puedes reintentar: no se duplicará (usa UID).</span>`
      );
    } finally {
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.textContent = "☁️ Sincronizar a Google Sheets";
      }
    }
  }

  // --- Scan ---
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
            syncedAt: "", // NUEVO
          };

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

  // --- Form behavior ---
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
      wrapFaltaOtra.style.display = "none";
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

      // Persistir “Observación tipo” cuando el usuario eligió “Otra”
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

  // --- Bindings ---
  scanBtn?.addEventListener("click", startScan);
  cancelScanBtn?.addEventListener("click", cancelScan);
  guardarBtn?.addEventListener("click", guardarEvento);

  syncBtn?.addEventListener("click", syncToGoogleSheets); // NUEVO

  limpiarBtn?.addEventListener("click", () => {
    if (confirm("¿Seguro que deseas borrar todos los registros guardados en este dispositivo?")) {
      clearRegistros();
      setNotice(`<strong>Registros borrados.</strong>`);
    }
  });

  exportarBtn?.addEventListener("click", exportarCSV);

  // --- Init ---
  refreshObsTipoOptions();
  refreshFaltaOptions();
  renderRegistros();
  updateFormByTipo();
});
