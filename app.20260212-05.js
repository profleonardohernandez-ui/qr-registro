document.addEventListener("DOMContentLoaded", () => {
  // --- UI ---
  const scanBtn = document.getElementById("scanBtn");
  const cancelScanBtn = document.getElementById("cancelScanBtn");
  const nuevoScanBtn = document.getElementById("nuevoScanBtn");
  const guardarBtn = document.getElementById("guardarBtn");

  const qrReader = document.getElementById("qr-reader");
  const resultado = document.getElementById("resultado");
  const formEvento = document.getElementById("formEvento");

  const codigoActual = document.getElementById("codigoActual");
  const horaActual = document.getElementById("horaActual");

  const tipo = document.getElementById("tipo");
  const wrapExcusa = document.getElementById("wrapExcusa");
  const excusa = document.getElementById("excusa");
  const wrapNivel = document.getElementById("wrapNivel");
  const nivel = document.getElementById("nivel");
  const obs = document.getElementById("obs");

  const verRegistrosBtn = document.getElementById("verRegistrosBtn");
  const limpiarHoyBtn = document.getElementById("limpiarHoyBtn");
  const borrarTodoBtn = document.getElementById("borrarTodoBtn");
  const listaRegistros = document.getElementById("listaRegistros");

  const countBadge = document.getElementById("countBadge"); // "Total: —" en el HTML

  // --- Estado ---
  let qrScanner = null;
  let pending = null; // evento pendiente de guardar

  // --- Helpers ---
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const todayLocal = () => new Date().toLocaleDateString();

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function chipTipoClass(t) {
    if (t === "TARDE") return "tipo-tarde";
    if (t === "CONVIVENCIA") return "tipo-convivencia";
    return "tipo-inasistencia";
  }

  function tipoLabel(t) {
    if (t === "TARDE") return "Llegada tarde";
    if (t === "CONVIVENCIA") return "Convivencia";
    return "Inasistencia";
  }

  // --- Storage (con migración suave) ---
  function getRegistros() {
    const raw = JSON.parse(localStorage.getItem("registros")) || [];
    return raw.map(r => ({
      codigo: r.codigo,
      fecha: r.fecha || todayLocal(),
      hora: r.hora || new Date().toLocaleTimeString(),
      fechaISO: r.fechaISO || r.isoDate || todayISO(),   // para limpiar hoy robusto
      timestamp: r.timestamp || new Date().toISOString(),
      tipo: r.tipo || "INASISTENCIA",
      excusa: r.excusa || null,
      nivel: r.nivel || null,
      obs: (r.obs ?? r.observacion ?? "").toString()
    }));
  }

  function setRegistros(regs) {
    localStorage.setItem("registros", JSON.stringify(regs));
    updateCount(regs.length);
  }

  function addRegistro(registro) {
    const regs = getRegistros();
    regs.push(registro);
    setRegistros(regs);
  }

  function updateCount(n) {
    if (!countBadge) return;
    countBadge.textContent = `Total: ${n}`;
  }

  // --- UI Logic ---
  function setNotice(htmlText) {
    resultado.innerHTML = htmlText;
  }

  function updateFormByTipo() {
    if (tipo.value === "TARDE") {
      wrapExcusa.style.display = "grid";
      wrapNivel.style.display = "none";
    } else if (tipo.value === "CONVIVENCIA") {
      wrapNivel.style.display = "grid";
      wrapExcusa.style.display = "none";
    } else {
      wrapExcusa.style.display = "none";
      wrapNivel.style.display = "none";
    }
  }

  tipo?.addEventListener("change", updateFormByTipo);

  async function startScan() {
    // UI
    formEvento.style.display = "none";
    qrReader.style.display = "block";
    cancelScanBtn.style.display = "inline-block";
    setNotice(`<strong>Escaneando…</strong><br><span class="small">Apunta la cámara al código QR.</span>`);

    if (!qrScanner) qrScanner = new Html5Qrcode("qr-reader");

    try {
      await qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (codigoQR) => {
          // Stop cámara
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

          // UI form
          codigoActual.textContent = `Código: ${codigoQR}`;
          horaActual.textContent = `Hora: ${pending.fecha} • ${pending.hora}`;

          tipo.value = "INASISTENCIA";
          excusa.value = "SIN_EXCUSA";
          nivel.value = "LEVE";
          obs.value = "";
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
    try { if (qrScanner) await qrScanner.stop(); } catch {}
    qrReader.style.display = "none";
    cancelScanBtn.style.display = "none";
    setNotice(`<strong>Escaneo cancelado.</strong><br><span class="small">Puedes intentar de nuevo.</span>`);
  }

  function resetPending() {
    pending = null;
    formEvento.style.display = "none";
    setNotice(`Listo para escanear.`);
  }

  function guardarEvento() {
    if (!pending) {
      setNotice(`<strong>Primero escanea un QR.</strong>`);
      return;
    }

    pending.tipo = tipo.value;
    pending.obs = obs.value.trim();

    if (pending.tipo === "TARDE") {
      pending.excusa = excusa.value;
      pending.nivel = null;
    } else if (pending.tipo === "CONVIVENCIA") {
      pending.nivel = nivel.value;
      pending.excusa = null;
    } else {
      pending.excusa = null;
      pending.nivel = null;
    }

    addRegistro(pending);

    setNotice(`<strong>Evento guardado ✅</strong><br>
      <span class="small">${escapeHtml(tipoLabel(pending.tipo))} • ${escapeHtml(pending.fecha)} ${escapeHtml(pending.hora)}</span>`);

    resetPending();
    renderRegistros(); // refresca lista y contador
  }

  // --- Render historial ---
  function renderRegistros() {
    const regs = getRegistros();
    updateCount(regs.length);

    if (regs.length === 0) {
      listaRegistros.innerHTML = `<div class="notice">No hay registros guardados.</div>`;
      return;
    }

    // más recientes primero
    const sorted = [...regs].sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));

    listaRegistros.innerHTML = sorted.map((r) => {
      const chips = [];

      chips.push(`<span class="chip ${chipTipoClass(r.tipo)}">${escapeHtml(tipoLabel(r.tipo))}</span>`);

      if (r.tipo === "TARDE" && r.excusa) {
        chips.push(`<span class="chip">${r.excusa === "CON_EXCUSA" ? "Con excusa" : "Sin excusa"}</span>`);
      }

      if (r.tipo === "CONVIVENCIA" && r.nivel) {
        chips.push(`<span class="chip">${escapeHtml(r.nivel)}</span>`);
      }

      if (r.obs) {
        chips.push(`<span class="chip">Obs</span>`);
      }

      const obsLine = r.obs ? `<div class="small" style="margin-top:8px;">${escapeHtml(r.obs)}</div>` : "";

      return `
        <div class="item">
          <div class="item-top">
            <div class="item-code">${escapeHtml(r.codigo)}</div>
            <div class="item-meta">${escapeHtml(r.fecha)} • ${escapeHtml(r.hora)}</div>
          </div>
          <div class="chips">${chips.join("")}</div>
          ${obsLine}
        </div>
      `;
    }).join("");
  }

  // --- Acciones historial ---
  function limpiarHoy() {
    const regs = getRegistros();
    const iso = todayISO();
    const loc = todayLocal();

    const deHoy = regs.filter(r => (r.fechaISO === iso) || (!r.fechaISO && r.fecha === loc));
    if (deHoy.length === 0) {
      listaRegistros.innerHTML = `<div class="notice">No hay registros de hoy para borrar.</div>`;
      return;
    }

    const ok = confirm(`¿Borrar ${deHoy.length} registro(s) de HOY (${iso})?`);
    if (!ok) return;

    const restantes = regs.filter(r => !((r.fechaISO === iso) || (!r.fechaISO && r.fecha === loc)));
    setRegistros(restantes);
    renderRegistros();
  }

  function borrarTodo() {
    const regs = getRegistros();
    if (regs.length === 0) {
      listaRegistros.innerHTML = `<div class="notice">No hay registros para borrar.</div>`;
      return;
    }

    const ok = confirm(`¿Borrar TODOS los registros (${regs.length})?`);
    if (!ok) return;

    localStorage.removeItem("registros");
    updateCount(0);
    renderRegistros();
  }

  // --- Wire ---
  scanBtn?.addEventListener("click", startScan);
  cancelScanBtn?.addEventListener("click", cancelScan);
  nuevoScanBtn?.addEventListener("click", () => { resetPending(); startScan(); });
  guardarBtn?.addEventListener("click", guardarEvento);

  verRegistrosBtn?.addEventListener("click", renderRegistros);
  limpiarHoyBtn?.addEventListener("click", limpiarHoy);
  borrarTodoBtn?.addEventListener("click", borrarTodo);

  // Init
  updateFormByTipo();
  renderRegistros();
});
