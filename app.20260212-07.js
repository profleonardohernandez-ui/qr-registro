document.addEventListener("DOMContentLoaded", () => {
  // --- UI ---
  const scanBtn = document.getElementById("scanBtn");
  const cancelScanBtn = document.getElementById("cancelScanBtn");
  const guardarBtn = document.getElementById("guardarBtn");
  const descartarBtn = document.getElementById("descartarBtn");
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

  // Observaciones tipo (Llegada tarde)
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
    try { return JSON.parse(raw) ?? fallback; } catch { return fallback; }
  }

  function norm(s) { return String(s || "").trim().toLowerCase(); }

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
        nivel: r.nivel || null,
        falta: r.falta || "",
        obs: r.obs || "",
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

  // --- Dynamic options ---
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

    obsTipo.value = [...obsTipo.options].some(o => o.value === current) ? current : "";
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

    falta.value = [...falta.options].some(o => o.value === current) ? current : "";
    refreshFaltaOtraUI();
  }

  function refreshFaltaOtraUI() {
    if (!wrapFaltaOtra || !faltaOtra) return;
    const show = (falta?.value === "_OTRA");
    wrapFaltaOtra.style.display = show ? "grid" : "none";
    if (!show) faltaOtra.value = "";
  }

  // --- Form behavior ---
  function updateFormByTipo() {
    const t = tipo.value;

    wrapExcusa.style.display = (t === "INASISTENCIA" || t === "TARDE") ? "grid" : "none";

    const isConvivencia = (t === "CONVIVENCIA");
    wrapNivel.style.display = isConvivencia ? "grid" : "none";
    wrapFalta.style.display = isConvivencia ? "grid" : "none";
    if (isConvivencia) refreshFaltaOptions();
    else wrapFaltaOtra.style.display = "none";

    wrapObsTipo.style.display = (t === "TARDE") ? "grid" : "none";
  }

  tipo?.addEventListener("change", updateFormByTipo);
  nivel?.addEventListener("change", refreshFaltaOptions);
  falta?.addEventListener("change", () => {
    refreshFaltaOtraUI();
    if (falta.value === "_OTRA") faltaOtra?.focus();
  });

  obsTipo?.addEventListener("change", () => {
    const v = obsTipo.value;
    if (!v) return;
    if (v === "_OTRA") { obs.focus(); return; }
    obs.value = v;
  });

  // --- Descarta lectura (nuevo, confiable) ---
  function descartarLectura() {
    pending = null;

    formEvento.style.display = "none";
    codigoActual.textContent = "Código: —";
    horaActual.textContent = "Hora: —";

    // Ocultar el botón hasta que haya un QR leído de nuevo
    if (descartarBtn) descartarBtn.style.display = "none";

    // Reset básico (por seguridad)
    tipo.value = "INASISTENCIA";
    if (excusa) excusa.value = "SIN_EXCUSA";
    if (nivel) nivel.value = "TIPO_I";
    if (falta) falta.value = "";
    if (faltaOtra) faltaOtra.value = "";
    if (obsTipo) obsTipo.value = "";
    if (obs) obs.value = "";

    updateFormByTipo();
    setNotice(`<strong>Listo.</strong> Presiona <em>Escanear QR</em>.`);
  }

  // --- Scan (NO tocamos lo que ya funciona) ---
  async function startScan() {
    formEvento.style.display = "none";
    qrReader.style.display = "block";
    cancelScanBtn.style.disp
