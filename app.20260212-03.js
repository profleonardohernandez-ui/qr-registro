document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scanBtn");
  const resultado = document.getElementById("resultado");
  const verRegistrosBtn = document.getElementById("verRegistrosBtn");
  const limpiarHoyBtn = document.getElementById("limpiarHoyBtn");
  const borrarTodoBtn = document.getElementById("borrarTodoBtn");
  const listaRegistros = document.getElementById("listaRegistros");

  if (!scanBtn || !resultado || !verRegistrosBtn || !limpiarHoyBtn || !borrarTodoBtn || !listaRegistros) {
    console.error("Faltan elementos del DOM. Revisa versión HTML/JS.");
    return;
  }

  const hoyStr = () => new Date().toLocaleDateString();

  function getRegistros() {
    return JSON.parse(localStorage.getItem("registros")) || [];
  }

  function setRegistros(registros) {
    localStorage.setItem("registros", JSON.stringify(registros));
  }

  function guardarLocal(registro) {
    const registros = getRegistros();
    registros.push(registro);
    setRegistros(registros);
  }

  function renderRegistros() {
    const registros = getRegistros();

    if (registros.length === 0) {
      listaRegistros.innerHTML = "<p>No hay registros guardados.</p>";
      return;
    }

    let html = `<h3>Registros guardados (${registros.length})</h3><ul>`;

    registros.forEach((r, index) => {
      html += `
        <li>
          <strong>${index + 1}.</strong>
          Código: ${r.codigo} |
          Fecha: ${r.fecha} |
          Hora: ${r.hora}
        </li>
      `;
    });

    html += "</ul>";
    listaRegistros.innerHTML = html;
  }

  // Escaneo QR
  scanBtn.addEventListener("click", () => {
    const qrScanner = new Html5Qrcode("resultado");

    qrScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (codigoQR) => {
        qrScanner.stop();

        const ahora = new Date();
        const registro = {
          codigo: codigoQR,
          fecha: ahora.toLocaleDateString(),
          hora: ahora.toLocaleTimeString()
        };

        guardarLocal(registro);

        resultado.innerHTML = `
          <strong>Registro guardado</strong><br>
          Código: ${registro.codigo}<br>
          Fecha: ${registro.fecha}<br>
          Hora: ${registro.hora}
        `;
      }
    );
  });

  // Ver registros
  verRegistrosBtn.addEventListener("click", () => {
    listaRegistros.innerHTML = "<p>Cargando registros...</p>";
    renderRegistros();
  });

  // Limpiar solo los registros de HOY
  limpiarHoyBtn.addEventListener("click", () => {
    const registros = getRegistros();
    const hoy = hoyStr();

    const deHoy = registros.filter(r => r.fecha === hoy);
    if (deHoy.length === 0) {
      listaRegistros.innerHTML = "<p>No hay registros de hoy para borrar.</p>";
      return;
    }

    const ok = confirm(`¿Borrar ${deHoy.length} registro(s) de HOY (${hoy})?`);
    if (!ok) return;

    const restantes = registros.filter(r => r.fecha !== hoy);
    setRegistros(restantes);
    listaRegistros.innerHTML = `<p>Listo: borrados ${deHoy.length} registro(s) de hoy.</p>`;
  });

  // Borrar todo
  borrarTodoBtn.addEventListener("click", () => {
    const registros = getRegistros();
    if (registros.length === 0) {
      listaRegistros.innerHTML = "<p>No hay registros para borrar.</p>";
      return;
    }

    const ok = confirm(`¿Borrar TODOS los registros (${registros.length})?`);
    if (!ok) return;

    localStorage.removeItem("registros");
    listaRegistros.innerHTML = "<p>Listo: se borraron todos los registros.</p>";
  });
});
