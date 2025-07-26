// Inicializar Firebase solo si aún no está inicializado
if (!firebase.apps.length) {
  const firebaseConfig = {
    apiKey: "AIzaSyAWD49AKD5nftRxVnQZoqiPZWiUbYnev7M",
    authDomain: "manos-de-angel-b0ce5.firebaseapp.com",
    projectId: "manos-de-angel-b0ce5",
    storageBucket: "manos-de-angel-b0ce5.appspot.com",
    messagingSenderId: "570701301886",
    appId: "1:570701301886:web:f498b2768c612f77d0b02f"
  };
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return (window.location.href = "/registros/index.html");

    try {
      const doc = await db.collection("usuarios").doc(user.uid).get();
      const data = doc.data();

      if (!data || data.rol !== "Jefa") {
        return (window.location.href = "/registros/index.html");
      }

      const nombreSpan = document.getElementById("nombre-usuario");
      if (nombreSpan) {
        nombreSpan.textContent = data.nombre || "Jefa 🌸";
      }

      // Iniciar funciones
      initFiltrosReservas();
      calcularResumenVentas();
      cargarCumpleañosProximos();
      console.log("📅 Buscando cumpleaños...");



    } catch (error) {
      console.error("Error al verificar rol:", error);
      alert("Error al verificar tu cuenta.");
      window.location.href = "/registros/index.html";
    }
  });

  // Botón cerrar sesión
  const btnCerrarSesion = document.getElementById("cerrar-sesion");
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", async () => {
      try {
        await auth.signOut();
        window.location.href = "/inicio/inicio.html";
      } catch (error) {
        console.error("Error cerrando sesión:", error);
        alert("No se pudo cerrar sesión.");
      }
    });
  }
});

function initFiltrosReservas() {
  const formFiltros = document.getElementById("form-filtros");
  const tablaReservas = document.getElementById("tabla-reservas");

  // Manejo dinámico de fechas
  const inputFecha = document.getElementById("fecha");
  const inputDesde = document.getElementById("desde");
  const inputHasta = document.getElementById("hasta");

  inputFecha.addEventListener("input", () => {
    if (inputFecha.value) {
      inputDesde.disabled = true;
      inputHasta.disabled = true;
      inputDesde.value = "";
      inputHasta.value = "";
    } else {
      inputDesde.disabled = false;
      inputHasta.disabled = false;
    }
  });

  // Listener de filtro
  formFiltros.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fecha = inputFecha.value;
    const desde = inputDesde.value;
    const hasta = inputHasta.value;
    const trabajadora = document.getElementById("filtro-trabajadora").value;
    const servicio = document.getElementById("filtro-servicio").value;
    const pago = document.getElementById("filtro-pago").value;

    try {
      let query = db.collection("reservas");

      if (fecha) {
        query = query.where("fecha", "==", fecha);
      } else {
        if (desde) query = query.where("fecha", ">=", desde);
        if (hasta) query = query.where("fecha", "<=", hasta);
      }

      if (trabajadora) query = query.where("trabajadora_id", "==", trabajadora);
      if (servicio) query = query.where("servicio", "==", servicio);
      if (pago) query = query.where("metodo_pago", "==", pago);

      const snapshot = await query.get();
      tablaReservas.innerHTML = "";

      if (snapshot.empty) {
        tablaReservas.innerHTML = `<tr><td colspan="10" class="text-center text-muted">No se encontraron reservas.</td></tr>`;
        return;
      }

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const clienteId = data.cliente_id;

        const clienteDoc = await db.collection("usuarios").doc(clienteId).get();
        const clienteData = clienteDoc.data();
        const nombreCliente = clienteData ? clienteData.nombre : clienteId;

        const fila = `
          <tr>
            <td>${nombreCliente}</td>
            <td>${data.nombreTrabajadora || "-"}</td>
            <td>${data.servicio || "-"}<br><small>${data.subservicio || ""}</small></td>
            <td>${data.fecha || "-"}</td>
            <td>${data.hora || "-"}</td>
            <td>${data.metodo_pago || "-"}</td>
            <td>${data.estado || "-"}</td>
            <td>
              <input type="checkbox" class="pagado-checkbox" data-id="${doc.id}" ${data.pagado ? "checked" : ""}>
            </td>
            <td><input type="checkbox" ${data.estado === "realizada" ? "checked" : ""} disabled></td>
            <td><button class="btn btn-sm btn-info">Ver</button></td>
          </tr>
        `;
        tablaReservas.innerHTML += fila;
      }
    } catch (error) {
      console.error("❌ Error cargando reservas:", error);
      tablaReservas.innerHTML = `<tr><td colspan="10" class="text-danger">Error al obtener las reservas.</td></tr>`;
    }
  });

  // Escucha cambios en los checkbox de pago
  tablaReservas.addEventListener("change", async (e) => {
    if (e.target.classList.contains("pagado-checkbox")) {
      const reservaId = e.target.dataset.id;
      const nuevoEstadoPagado = e.target.checked;

      try {
        const nuevaData = { pagado: nuevoEstadoPagado };
        if (nuevoEstadoPagado) {
          nuevaData.estado = "Pagado";
        }

        await db.collection("reservas").doc(reservaId).update(nuevaData);

        // Actualiza columna estado visualmente
        const fila = e.target.closest("tr");
        if (fila) {
          fila.querySelector("td:nth-child(7)").textContent = nuevoEstadoPagado ? "Pagado" : "pendiente";
        }

      } catch (error) {
        console.error("❌ Error actualizando estado:", error);
        alert("No se pudo actualizar.");
        e.target.checked = !nuevoEstadoPagado;
      }
    }
  });
}
let graficoServicios;
function crearGraficoServicios(datos) {
  const ctx = document.getElementById("graficoServicios").getContext("2d");
  const etiquetas = Object.keys(datos);
  const valores = Object.values(datos);

  if (graficoServicios) {
    graficoServicios.destroy();
  }

  graficoServicios = new Chart(ctx, {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [{
        label: "Ventas por servicio",
        data: valores,
        backgroundColor: [
          "#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0", "#9966ff", "#ff9f40"
        ],
        borderColor: "#333",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `$${ctx.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => `$${val.toLocaleString()}`
          }
        }
      }
    }
  });
}

// Resumen de ventas
async function calcularResumenVentas() {
  const hoy = new Date().toISOString().split("T")[0];

  try {
    const snapshot = await db.collection("reservas").where("pagado", "==", true).get();

    let totalDiario = 0;
    let totalSemanal = 0;
    const porTrabajadora = {};
    const porServicio = {};

    const hoyDate = new Date(hoy);
    const hace7dias = new Date(hoyDate);
    hace7dias.setDate(hoyDate.getDate() - 6);

    snapshot.forEach(doc => {
      const data = doc.data();
      const precio = Number(data.precio || 0);
      const fechaReserva = data.fecha;
      if (!fechaReserva || isNaN(precio)) return;

      const fechaDate = new Date(fechaReserva);

      if (fechaReserva === hoy) totalDiario += precio;
      if (fechaDate >= hace7dias && fechaDate <= hoyDate) totalSemanal += precio;

      const trabajadora = data.nombreTrabajadora || "Sin asignar";
      porTrabajadora[trabajadora] = (porTrabajadora[trabajadora] || 0) + precio;

      const servicio = data.servicio || "Sin servicio";
      porServicio[servicio] = (porServicio[servicio] || 0) + precio;
    });

    // Actualizar totales en HTML
    const totalDiarioElem = document.getElementById("total-diario");
    if (totalDiarioElem) totalDiarioElem.textContent = `$${totalDiario.toLocaleString()}`;
    const totalSemanalElem = document.getElementById("total-semanal");
    if (totalSemanalElem) totalSemanalElem.textContent = `$${totalSemanal.toLocaleString()}`;

    // Llenar tabla diaria
    const tablaDiario = document.getElementById("tabla-diario");
    if (tablaDiario) {
      tablaDiario.innerHTML = "";
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.fecha === hoy) {
          const cliente = data.cliente_nombre || "Desconocido";
          const servicio = data.servicio || "-";
          const total = data.precio || 0;
          tablaDiario.innerHTML += `
            <tr>
              <td>${cliente}</td>
              <td>${servicio}</td>
              <td>$${total.toLocaleString()}</td>
            </tr>`;
        }
      });
    }

    // Llenar tabla semanal
    const tablaSemanal = document.getElementById("tabla-semanal");
    if (tablaSemanal) {
      tablaSemanal.innerHTML = "";
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const fechaDate = new Date(data.fecha);
        if (fechaDate >= hace7dias && fechaDate <= hoyDate) {
          const fecha = data.fecha || "-";
          const servicio = data.servicio || "-";
          const total = data.precio || 0;
          tablaSemanal.innerHTML += `
            <tr>
              <td>${fecha}</td>
              <td>${servicio}</td>
              <td>$${total.toLocaleString()}</td>
            </tr>`;
        }
      });
    }

    // Llenar tabla trabajadoras
    const tablaTrabajadoras = document.getElementById("tabla-trabajadoras");
    if (tablaTrabajadoras) {
      tablaTrabajadoras.innerHTML = "";
      for (const [trabajadora, total] of Object.entries(porTrabajadora)) {
        tablaTrabajadoras.innerHTML += `
          <tr>
            <td>${trabajadora}</td>
            <td>$${total.toLocaleString()}</td>
          </tr>`;
      }
    }

    // Llenar tabla servicios
    const tablaServicios = document.getElementById("tabla-servicios");
    if (tablaServicios) {
      tablaServicios.innerHTML = "";
      for (const [servicio, total] of Object.entries(porServicio)) {
        tablaServicios.innerHTML += `
          <tr>
            <td>${servicio}</td>
            <td>$${total.toLocaleString()}</td>
          </tr>`;
      }
    }

    // Guardar resumen global
    window.resumenVentas = {
      diario: totalDiario,
      semanal: totalSemanal,
      porTrabajadora,
      porServicio
    };

    // Crear gráfico de servicios
    crearGraficoServicios(porServicio);

  } catch (error) {
    console.error("❌ Error al calcular resumen de ventas:", error);
  }
}

  document.getElementById("tab-diario").addEventListener("click", () => mostrarResumen("diario"));
  document.getElementById("tab-semanal").addEventListener("click", () => mostrarResumen("semanal"));
  document.getElementById("tab-trabajadoras").addEventListener("click", () => mostrarResumen("trabajadoras"));
  document.getElementById("tab-servicios").addEventListener("click", () => mostrarResumen("servicios"));

  // Mostrar la pestaña por defecto (diario)
  mostrarResumen("diario");

  // Calcular el resumen al cargar la página
  calcularResumenVentas();


function mostrarResumen(tab) {
  const tabs = ["diario", "semanal", "trabajadoras", "servicios"];

  tabs.forEach(t => {
    document.getElementById(`resumen-${t}`).classList.add("d-none");
    document.getElementById(`tab-${t}`).classList.remove("active");
  });

  document.getElementById(`resumen-${tab}`).classList.remove("d-none");
  document.getElementById(`tab-${tab}`).classList.add("active");
}
async function cargarCumpleañosProximos() {
  const lista = document.getElementById("lista-cumpleaños");
  if (!lista) return;

  lista.innerHTML = `<li class="list-group-item text-center text-muted">📅 Buscando cumpleaños...</li>`;

  try {
    const snapshot = await db.collection("usuarios").get();
    const hoy = new Date();
    const cumpleañosProximos = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.fecha_nacimiento) return;

      const nombre = data.nombre || "Sin nombre";
      const rol = data.rol || "Cliente";

      // Separar fecha nacimiento (YYYY-MM-DD)
      const [year, month, day] = data.fecha_nacimiento.split("-");
      const fechaNacimiento = new Date(Number(year), Number(month) - 1, Number(day));

      // Cumpleaños este año
      const cumpleañosEsteAño = new Date(hoy.getFullYear(), fechaNacimiento.getMonth(), fechaNacimiento.getDate());

      // Si ya pasó este año, mostrar el del próximo año
      if (cumpleañosEsteAño < hoy) {
        cumpleañosEsteAño.setFullYear(hoy.getFullYear() + 1);
      }

      const diferenciaDias = Math.floor((cumpleañosEsteAño - hoy) / (1000 * 60 * 60 * 24));

      if (diferenciaDias <= 7) {
        cumpleañosProximos.push({
          nombre,
          fecha: cumpleañosEsteAño,
          rol: rol.charAt(0).toUpperCase() + rol.slice(1)
        });

        console.log("🎂 Próximo cumpleaños:", nombre, cumpleañosEsteAño.toDateString(), diferenciaDias + " días");
      }
    });

    // Ordenar por fecha
    cumpleañosProximos.sort((a, b) => a.fecha - b.fecha);

    // Mostrar en HTML
    if (cumpleañosProximos.length === 0) {
      lista.innerHTML = `<li class="list-group-item text-center text-muted">No hay cumpleaños próximos.</li>`;
      return;
    }

    lista.innerHTML = "";
    cumpleañosProximos.forEach(persona => {
      const año = persona.fecha.getFullYear();
      const mes = String(persona.fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(persona.fecha.getDate()).padStart(2, '0');
      const fechaFormateada = `${año}-${mes}-${dia}`;

      const item = `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <span>${persona.nombre} (${persona.rol})</span>
          <span class="text-muted">[${fechaFormateada}]</span>
        </li>
      `;
      lista.innerHTML += item;
    });


  } catch (error) {
    console.error("❌ Error cargando cumpleaños:", error);
    lista.innerHTML = `<li class="list-group-item text-danger text-center">Error al cargar cumpleaños.</li>`;
  }
}


