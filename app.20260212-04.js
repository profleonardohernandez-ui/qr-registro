document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scanBtn");
  const cancelScanBtn = document.getElementById("cancelScanBtn");
  const nuevoScanBtn = document.getElementById("nuevoScanBtn");
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

  const guardarBtn = document.getElementById("guardarBtn");

  const verRegistrosBtn = document.getElementById("verRegistrosBtn");
  const limpiarHoyBtn = document.getElementById("limpiarHoyBtn");
  const borrarTodoBtn = document.getElementById("borrarTodoBtn");
  const listaRegistros = document.getElementById("listaRegistros");

  let qrScanner = null;
  let pending = null; // evento pendiente de guardar

  const BUILD_TODAY_ISO = () => new Date().toISOString().slice(0, 10);
  const now = () => new Date();

  function getRegistros() {
    const raw = JSON.parse(localStorage.getItem("registros")) || [];
    // Migración suave de registros antiguos
    return raw.map(r => ({
      codigo: r.codigo,
      fecha: r.fecha || new Date().toLocaleDateString(),
      hora: r.hora || new Date().toLocaleTimeString(),
      fechaISO: r.fechaISO || BUILD_TODAY_ISO(),
      timestamp: r.timestamp || new Date().toISOString(),
      tipo: r.tipo || "INASISTENCIA",
      excusa: r.excusa || null,
      nivel: r.nivel || null,
      obs: r.obs || r.observacion || ""
    }));
  }

  function setRegistros(regs) {
    localStorage.setItem("registros", JSON.stringify(regs));
  }

  function guardarLocal(registro) {
    const regs = getRegistros();
    regs.push(registro);
    setRegistros(regs);
  }

  function tipoChipClass(t) {
    if (t === "TARDE") return "tipo-tarde";
    if (t === "CONVIVENCIA") return "tipo-convivencia";
    return "tipo-inasistencia";
  }

  function tipoLabel(t) {
    if (t === "TARDE") return "Llegada tarde";
    if (t === "CONVIVENCIA") return "Convivencia";
    return "Inasistencia";
  }

  function renderRegistros() {
    const regs = getRegistros();
    if (regs.length === 0) {
      listaRegistros.innerHTML = `<div class="notice">No hay registros guardados.</div>`;
      return;
    }

    // Últimos primero
    const sorted = [...regs].reverse();

    listaRegistros.innerHTML = sorted.map((r) => {
      const chips = [];
      chips.push(`<span class="chip ${tipoChipClass(r.tipo)}">${tipoLabel(r.tipo)}</span>`);
      if (r.tipo === "TARDE" && r.excusa) chips.push(`<span class="chip">${r.excusa === "CON_EXCUSA" ? "Con excusa" : "Sin excusa"}</span>`);
      if (r.tipo === "CONVIVENCIA" && r.nivel) chips.push(`<span class="chip">${r.nivel}</span>`);
      if (r.obs) chips.push(`<span class="chip">Obs</span>`);

      return `
        <div class="item">
          <div class="item-top">
            <div class="item-code">${escapeHtml(r.codigo)}</div>
            <div class="item-meta">${escapeHtml(r.fecha)} • ${escapeHtml(r.hora)}</div>
          </div>
          <div class="chips">${chips.join("")}</div>
          ${r.obs ? `<div class="small" style="margin-top:8px;">${escapeHtml(r.obs)}</div>` : ""}
        </div>
      `;
    }).join("");
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

  tipo.addEventListener("change", updateFormByTipo);

  async function startScan() {
    resultado.textContent = "Iniciando cámara...";
    qrReader.style.display = "block";
    cancelScanBtn.style.display = "inline-block";
    formEvento.style.display = "none";

    if (!qrScanner) qrScanner = new Html5Qrcode("qr-reader");

    try {
      await qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (codigoQR) => {
          try { await qrScanner.stop(); } catch {}
          qrReader.style.display = "none";
          cancelScanBtn.style.display = "none";

          const a = now();
          pending = {
            codigo: codigoQR,
            fecha: a.toLocaleDateString(),
            hora: a.toLocaleTimeString(),
            fechaISO: BUILD_TODAY_ISO(),
            timestamp: a.toISOString(),
            tipo: "INASISTENCIA",
            excusa: null,
            nivel: null,
            obs: ""
          };

          // UI
          resultado.innerHTML = `<strong>QR leído:</strong> ${escapeHtml(codigoQR)}<br><span class="small">Selecciona tipo y guarda.</span>`;
          codigoActual.textContent = `Código: ${codigoQR}`;
          horaActual.textContent = `Hora: ${pending.fecha} • ${pending.hora}`;

          // defaults
          tipo.value = "INASISTENCIA";
          excusa.value = "SIN_EXCUSA";
          nivel.value = "LEVE";
          obs.value = "";
          updateFormByTipo();

          formEvento.style.display = "block";
        }
      );
    } catch (e) {
      resultado.textContent = "No se pudo iniciar la cámara. Revisa permisos.";
      qrReader.style.display = "none";
      cancelScanBtn.style.display = "none";
    }
  }

  async function cancelScan() {
    try { if (qrScanner) await qrScanner.stop(); } catch {}
    qrReader.style.display = "none";
    cancelScanBtn.style.display = "none";
    resultado.textContent = "Escaneo cancelado.";
  }

  function resetPending() {
    pending = null;
    formEvento.style.display = "none";
    resultado.textContent = "Listo para escanear.";
  }

  scanBtn.addEventListener("click", startScan);
  cancelScanBtn.addEventListener("click", cancelScan);
  nuevoScanBtn.addEventListener("click", () => {
    resetPending();
    startScan();
  });

  guardarBtn.addEventListener("click", () => {
    if (!pending) {
      resultado.textContent = "Primero escanea un QR.";
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

    guardarLocal(pending);
    resultado.innerHTML = `<strong>Evento guardado</strong><br><span class="small">Puedes ver el historial en “Ver registros”.</span>`;
    resetPending();
  });

  // Registros
  verRegistrosBtn.addEventListener("click", () => {
    listaRegistros.innerHTML = `<div class="notice">Cargando…</div>`;
    renderRegistros();
  });

  limpiarHoyBtn.addEventListener("click", () => {
    const regs = getRegistros();
    const hoy = BUILD_TODAY_ISO();
    const deHoy = regs.filter(r => r.fechaISO === hoy);

    if (deHoy.length === 0) {
      listaRegistros.innerHTML = `<div class="notice">No hay registros de hoy para borrar.</div>`;
      return;
    }

    const ok = confirm(`¿Borrar ${deHoy.length} registro(s) de HOY (${hoy})?`);
    if (!ok) return;

    const restantes = regs.filter(r => r.fechaISO !== hoy);
    setRegistros(restantes);
    listaRegistros.innerHTML = `<div class="notice">Listo: borrados ${deHoy.length} registro(s) de hoy.</div>`;
  });

  borrarTodoBtn.addEventListener("click", () => {
    const regs = getRegistros();
    if (regs.length === 0) {
      listaRegistros.innerHTML = `<div class="notice">No hay registros para borrar.</div>`;
      return;
    }

    const ok = confirm(`¿Borrar TODOS los registros (${regs.length})?`);
    if (!ok) return;

    localStorage.removeItem("registros");
    listaRegistros.innerHTML = `<div class="notice">Listo: se borraron todos los registros.</div>`;
  });
});
