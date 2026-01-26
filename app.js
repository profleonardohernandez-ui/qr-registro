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