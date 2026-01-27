document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scanBtn");
  const resultado = document.getElementById("resultado");
  const verRegistrosBtn = document.getElementById("verRegistrosBtn");
  const listaRegistros = document.getElementById("listaRegistros");

  if (!scanBtn || !resultado || !verRegistrosBtn || !listaRegistros) {
    // Si esto pasa, el HTML no coincide con el JS cargado.
    console.error("Faltan elementos del DOM. Revisa versión HTML/JS.");
    return;
  }

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

  verRegistrosBtn.addEventListener("click", () => {
    // feedback inmediato para que “no pase nada” nunca
    listaRegistros.innerHTML = "<p>Cargando registros...</p>";
    mostrarRegistros();
  });

  function guardarLocal(registro) {
    const registros = JSON.parse(localStorage.getItem("registros")) || [];
    registros.push(registro);
    localStorage.setItem("registros", JSON.stringify(registros));
  }

  function mostrarRegistros() {
    const registros = JSON.parse(localStorage.getItem("registros")) || [];

    if (registros.length === 0) {
      listaRegistros.innerHTML = "<p>No hay registros guardados.</p>";
      return;
    }

    let html = "<h3>Registros guardados</h3><ul>";
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
});
