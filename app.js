const scanBtn = document.getElementById("scanBtn");
const resultado = document.getElementById("resultado");

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

function guardarLocal(registro) {
  let registros = JSON.parse(localStorage.getItem("registros")) || [];
  registros.push(registro);
  localStorage.setItem("registros", JSON.stringify(registros));

}
const verRegistrosBtn = document.getElementById("verRegistrosBtn");
const listaRegistros = document.getElementById("listaRegistros");

verRegistrosBtn.addEventListener("click", mostrarRegistros);

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
