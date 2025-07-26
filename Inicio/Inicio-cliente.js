console.log("inicio.js cargado");

document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "/inicio/inicio.html";
  }
  

// Ejecutar si estamos en inicio.html
if (window.location.pathname.includes("/inicio/inicio.html")) {
  mostrarOpinionesPublicas();
}

});


  if (typeof firebase === "undefined" || typeof emailjs === "undefined") {
    console.error("Firebase o EmailJS no están definidos.");
    return;
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  const span = document.getElementById("nombre-usuario");
  const btnAbrir = document.getElementById('btn-abrir-reserva');
  const btnCerrar = document.getElementById('btn-cerrar-reserva');
  const modal = document.getElementById('modal-reserva');
  const fotoDiv = document.getElementById('foto-trabajadora');
  const selectTrabajadora = document.getElementById('trabajadora');
  const fechaInput = document.getElementById('fecha');
  const horaSelect = document.getElementById('hora');
  const formReserva = document.getElementById('form-reserva');
  const mensajeReserva = document.getElementById('mensaje-reserva');
  const selectServicio = document.getElementById('servicio');
  const selectSubservicio = document.getElementById('subservicio');
  const precioTexto = document.getElementById('precio-servicio');
  const duracionTexto = document.getElementById('duracion-servicio');
  const grupoPatologia = document.getElementById("grupo-patologia");
  const tienePatologia = document.getElementById("tiene-patologia");
  const campoPatologia = document.getElementById("detalle-patologia");
  const campoDetallePatologia = document.getElementById("campo-patologia");


  let nombreUsuario = "Cliente 🌼";

  const duracionRango = {
    "Manicurista": {
      "Manicure": [40, 60],
      "Pedicure": [50, 70],
      "Esmaltado permanente": [45, 60],
      "Sistema acrílico": [90, 120],
      "Soft gel": [60, 90],
      "Dipping": [60, 90]
    },
    "Lashista": {
      "Permanente de pestañas": [60, 90],
      "Ondulación de pestañas": [60, 75],
      "Extensión de pestañas": [90, 150],
      "Todo ceja": [45, 60]
    },
    "Masajes": {
      "Relajación": [45, 60],
      "Descontracturante": [50, 70],
      "Drenaje linfático": [45, 60],
      "Reductivo": [45, 60]
    },
    "Peluquería": {
      "Alisado permanente": [120, 180],
      "Lavado": [20, 30],
      "Masaje capilar": [20, 30]
    },
    "Podología": {
      "Consulta": [20, 30],
      "Tratamiento": [30, 45],
      "Revisión": [20, 30]
    }
  };

  const preciosPorSubservicio = {
    "Manicurista": {
      "Manicure": 15000,
      "Pedicure": 15000,
      "Esmaltado permanente": 18000,
      "Sistema acrílico": 20000,
      "Soft gel": 18000,
      "Dipping": 19000
    },
    "Lashista": {
      "Permanente de pestañas": 22000,
      "Ondulación de pestañas": 21000,
      "Extensión de pestañas": 30000,
      "Todo ceja": 15000
    },
    "Masajes": {
      "Relajación": 25000,
      "Descontracturante": 27000,
      "Drenaje linfático": 30000,
      "Reductivo": 28000
    },
    "Peluquería": {
      "Alisado permanente": 25000,
      "Lavado": 15000,
      "Masaje capilar": 18000
    },
    "Podología": {
      "Consulta": 12000,
      "Tratamiento": 20000,
      "Revisión": 10000
    }
  };

  const subserviciosPorServicio = {};
  for (const servicio in preciosPorSubservicio) {
    subserviciosPorServicio[servicio] = Object.keys(preciosPorSubservicio[servicio]);
  }
  

  function actualizarPrecio() {
    const servicio = selectServicio.value;
    const subservicio = selectSubservicio.value;
    const precio = preciosPorSubservicio[servicio]?.[subservicio];
    const duracion = duracionRango[servicio]?.[subservicio];

    precioTexto.textContent = precio ? `Precio: $${precio.toLocaleString('es-CL')}` : "Precio: -";
    duracionTexto.textContent = duracion ? `⏱ Duración estimada: ${duracion[0]} - ${duracion[1]} minutos` : "Duración: -";
  }

  async function cargarHorasDisponibles(trabajadoraId, fecha) {
    const todasLasHoras = [
      "09:00", "10:00", "11:00", "12:00",
      "13:00", "14:00", "15:00", "16:00",
      "17:00", "18:00", "19:00"
    ];

    try {
      const snapshot = await db.collection('reservas')
        .where('trabajadora_id', '==', trabajadoraId)
        .where('fecha', '==', fecha)
        .get();

      const horasOcupadas = snapshot.docs.map(doc => doc.data().hora);
      const horasDisponibles = todasLasHoras.filter(hora => !horasOcupadas.includes(hora));

      horaSelect.innerHTML = '<option value="" disabled selected>Selecciona una hora</option>';
      if (horasDisponibles.length === 0) {
        horaSelect.innerHTML += '<option disabled>Sin disponibilidad 🕐</option>';
      } else {
        horasDisponibles.forEach(hora => {
          horaSelect.innerHTML += `<option value="${hora}">${hora} hrs</option>`;
        });
      }
    } catch (error) {
      console.error("Error al cargar horas disponibles:", error);
    }
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const doc = await db.collection("usuarios").doc(user.uid).get();
        nombreUsuario = doc.exists ? (doc.data().nombre || nombreUsuario) : nombreUsuario;
        if (span) span.textContent = nombreUsuario;
      } catch (e) {
        console.error("Error al obtener el nombre del usuario:", e);
        if (span) span.textContent = nombreUsuario;
      }
      cargarHistorialReservas();
    } else {
      if (span) span.textContent = "Invitado 🌼";
      document.getElementById('lista-reservas').innerHTML = "<p>Por favor inicia sesión para ver tus reservas.</p>";
    }
  });

  if (selectServicio && selectSubservicio) {
  const grupoPatologia = document.getElementById("grupo-patologia");
  const tienePatologia = document.getElementById("tiene-patologia");
  const campoPatologia = document.getElementById("detalle-patologia");
  const campoDetallePatologia = document.getElementById("campo-patologia");

  selectServicio.addEventListener('change', () => {
    const servicio = selectServicio.value;

    // Cargar subservicios
    const opciones = subserviciosPorServicio[servicio] || [];
    selectSubservicio.innerHTML = '<option value="" disabled selected>Selecciona una opción</option>';
    opciones.forEach(sub => {
      const option = document.createElement('option');
      option.value = sub;
      option.textContent = sub;
      selectSubservicio.appendChild(option);
    });
    selectSubservicio.disabled = opciones.length === 0;
    actualizarPrecio();

    // Mostrar campo patología solo si se elige 'Masajes'
    if (servicio === "Masajes") {
      grupoPatologia.style.display = "block";
    } else {
      grupoPatologia.style.display = "none";
      tienePatologia.value = "";
      campoDetallePatologia.style.display = "none";
      campoPatologia.value = "";
    }
  });

  tienePatologia.addEventListener("change", () => {
    if (tienePatologia.value === "sí") {
      campoDetallePatologia.style.display = "block";
    } else {
      campoDetallePatologia.style.display = "none";
      campoPatologia.value = "";
    }
  });

  selectSubservicio.addEventListener('change', () => {
    actualizarPrecio();
    const t = selectTrabajadora.value;
    const f = fechaInput.value;
    if (t && f) cargarHorasDisponibles(t, f);
  });
}

if (btnAbrir) btnAbrir.addEventListener('click', e => {
  e.preventDefault();
  modal.style.display = 'flex';
});

if (btnCerrar) btnCerrar.addEventListener('click', () => {
  modal.style.display = 'none';
});

if (selectTrabajadora) {
  selectTrabajadora.addEventListener('change', () => {
    const fotoUrl = selectTrabajadora.selectedOptions[0].getAttribute('data-foto');
    fotoDiv.style.backgroundImage = fotoUrl ? `url(${fotoUrl})` : '';
    const fecha = fechaInput.value;
    if (fecha) cargarHorasDisponibles(selectTrabajadora.value, fecha);
  });
}

if (fechaInput) {
  fechaInput.addEventListener('change', () => {
    const trabajadoraId = selectTrabajadora.value;
    if (trabajadoraId) cargarHorasDisponibles(trabajadoraId, fechaInput.value);
  });
}

if (formReserva) {
  formReserva.addEventListener('submit', async (e) => {
    e.preventDefault();
    const servicio = selectServicio.value;
    const subservicio = selectSubservicio.value;
    const trabajadora_id = selectTrabajadora.value;
    const fecha = fechaInput.value;
    const hora = horaSelect.value;
    const metodo_pago = document.getElementById('metodo_pago').value;
    const user = auth.currentUser;

    if (!user || !servicio || !subservicio || !trabajadora_id || !fecha || !hora || !metodo_pago) {
      alert("Completa todos los campos e inicia sesión.");
      return;
    }

    try {
      const precio = preciosPorSubservicio[servicio]?.[subservicio] || 15000;
      const nombreTrabajadora = selectTrabajadora.selectedOptions[0].text;

      // Revisar si hay patología (solo si servicio es "Masajes")
      
      let patologia = null;
      if (servicio === "Masajes" && grupoPatologia) {
        const tiene = tienePatologia?.value || "no";
        const detalle = campoPatologia?.value?.trim() || "";
        patologia = {
          tiene: tiene === "sí",
          detalle: tiene === "sí" ? detalle : null
        };
      }


      // Guardar en Firebase
      const reserva = {
        cliente_id: user.uid,
        trabajadora_id,
        nombreTrabajadora,
        servicio,
        subservicio,
        fecha,
        hora,
        metodo_pago,
        precio,
        estado: "pendiente",
        pagado: false,
        comentario_trabajadora: "",
        ...(patologia && { patologia })
      };

      await db.collection("reservas").add(reserva);

      mensajeReserva.innerText = "✅ Reserva realizada con éxito.";

      emailjs.send("service_hwltdfj", "template_b3rrnos", {
        nombre: nombreUsuario,
        email: user.email,
        servicio,
        subservicio,
        fecha,
        hora,
        nombreTrabajadora
      });

      // Limpiar formulario
      formReserva.reset();
      fotoDiv.style.backgroundImage = "";
      selectSubservicio.innerHTML = '<option value="" disabled selected>Selecciona una opción</option>';
      precioTexto.textContent = "Precio: -";
      duracionTexto.textContent = "Duración: -";
      horaSelect.innerHTML = '<option value="" disabled selected>Selecciona una hora</option>';
      grupoPatologia.style.display = "none";
      campoDetallePatologia.style.display = "none";

      setTimeout(() => {
        modal.style.display = "none";
        mensajeReserva.innerText = "";
        cargarHistorialReservas();
        const listaDiv = document.getElementById('lista-reservas');
        if (!user || !listaDiv) return;

      }, 2000);

    } catch (error) {
      console.error("Error al guardar la reserva:", error);
      alert("❌ Error al guardar la reserva.");
    }
  });
}


  async function cargarHistorialReservas() {
  const user = auth.currentUser;
  const listaDiv = document.getElementById('lista-reservas');
  if (!user) return;
  if (!listaDiv) {
    console.warn("Elemento 'lista-reservas' no encontrado en el DOM.");
    return;
  }
  
  listaDiv.innerHTML = "Cargando reservas...";

  try {
    const snapshot = await db.collection('reservas')
      .where('cliente_id', '==', user.uid)
      .orderBy('fecha', 'desc')
      .get();

    if (snapshot.empty) {
      if (listaDiv) listaDiv.innerHTML = "<p>No tienes reservas realizadas aún.</p>";
      return;
    }

    let html = `<table><thead><tr>
      <th>Servicio</th><th>Subservicio</th><th>Fecha</th>
      <th>Hora</th><th>Trabajadora</th><th>Estado</th>
      <th>Método de Pago</th><th>Precio</th>
      </tr></thead><tbody>`;

    snapshot.forEach(doc => {
      const r = doc.data();
      html += `<tr>
        <td>${r.servicio || ''}</td>
        <td>${r.subservicio || ''}</td>
        <td>${r.fecha || ''}</td>
        <td>${r.hora || ''}</td>
        <td>${r.nombreTrabajadora || '-'}</td>
        <td>${r.estado || ''}</td>
        <td>${r.metodo_pago || ''}</td>
        <td>${r.precio ? '$' + r.precio.toLocaleString('es-CL') : '-'}</td>
      </tr>`;
    });

    html += '</tbody></table>';

    if (listaDiv) listaDiv.innerHTML = html;

  } catch (error) {
    console.error('Error al cargar reservas:', error);
    if (listaDiv) listaDiv.innerText = "Error al cargar tus reservas.";
  }
}

  const estrellas = document.querySelectorAll("#estrellas span");
let valorEstrellaSeleccionada = 0;

estrellas.forEach(estrella => {
  estrella.addEventListener("click", () => {
    valorEstrellaSeleccionada = parseInt(estrella.getAttribute("data-valor"));
    estrellas.forEach(e => e.classList.remove("seleccionada"));
    for (let i = 0; i < valorEstrellaSeleccionada; i++) {
      estrellas[i].classList.add("seleccionada");
    }
  });
});

const btnEnviarOpinion = document.getElementById("btn-enviar-opinion");
const comentarioInput = document.getElementById("comentario");
const mensajeOpinion = document.getElementById("mensaje-opinion");
const opinionesMostradas = document.getElementById("opiniones-mostradas");

btnEnviarOpinion.addEventListener("click", async () => {
  const comentario = comentarioInput.value.trim();
  const user = firebase.auth().currentUser;

  if (!user) {
    mensajeOpinion.textContent = "Debes iniciar sesión para dejar una opinión.";
    return;
  }

  if (valorEstrellaSeleccionada === 0 || comentario === "") {
    mensajeOpinion.textContent = "Por favor, selecciona estrellas y escribe un comentario.";
    return;
  }

  try {
    const docUser = await db.collection("usuarios").doc(user.uid).get();
    // Si no existe nombre, dejar vacío (o puedes usar user.email o displayName si tienes)
    const nombre = docUser.exists && docUser.data().nombre ? docUser.data().nombre : "";

    await db.collection("opinion").add({
      uid: user.uid,
      nombre,
      estrellas: valorEstrellaSeleccionada,
      comentario,
      fecha: new Date().toISOString()
    });

    mensajeOpinion.textContent = "✅ ¡Gracias por tu opinión!";
    comentarioInput.value = "";
    estrellas.forEach(e => e.classList.remove("seleccionada"));
    valorEstrellaSeleccionada = 0;

    cargarOpiniones(); // Actualizar opiniones mostradas
  } catch (error) {
    console.error("Error al guardar opinión:", error);
    mensajeOpinion.textContent = "❌ Error al guardar tu opinión, intenta nuevamente.";
  }
});

async function cargarOpiniones() {
  if (!opinionesMostradas) return;
  try {
    const snapshot = await db.collection("opinion").orderBy("fecha", "desc").limit(10).get();

    // Actualiza cantidad de opiniones
    const totalOpinionesSnapshot = await db.collection("opinion").get();
    const cantidadOpiniones = totalOpinionesSnapshot.size;

    const cantidadOpinionesElem = document.getElementById("cantidad-opiniones");
    if (cantidadOpinionesElem) {
      cantidadOpinionesElem.textContent = `(${cantidadOpiniones} ${cantidadOpiniones === 1 ? "opinión" : "opiniones"})`;
    }

    if (snapshot.empty) {
      opinionesMostradas.innerHTML = "<p>Aún no hay opiniones.</p>";
      return;
    }

    let html = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const estrellasHTML = "★".repeat(data.estrellas) + "☆".repeat(5 - data.estrellas);
      html += `
        <div class="opinion">
          <strong>${data.nombre || ""}</strong><br/>
          <span style="color: gold; font-size: 20px;">${estrellasHTML}</span>
          <p>${data.comentario}</p>
        </div>`;
    });
    opinionesMostradas.innerHTML = html;
  } catch (error) {
    console.error("Error al cargar opiniones:", error);
    opinionesMostradas.innerHTML = "<p>Error al cargar opiniones.</p>";
  }
}

function mostrarOpinionesPublicas() {
  const opinionesDiv = document.getElementById("opiniones-publicas");
  const promedioEstrellas = document.getElementById("promedio-estrellas");
  const totalOpinionesSpan = document.getElementById("total-opiniones");

  if (!opinionesDiv || !firebase.firestore) return;

  const db = firebase.firestore();

  db.collection("opiniones")
    .orderBy("fecha", "desc")
    .limit(5)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        opinionesDiv.innerHTML = "<p>Aún no hay opiniones.</p>";
        return;
      }

      let html = "";
      let suma = 0;
      let total = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        const estrellas = "★".repeat(data.estrellas) + "☆".repeat(5 - data.estrellas);
        html += `
          <div class="opinion">
            <strong>${data.nombre || "Cliente"}</strong><br/>
            <span style="color: gold; font-size: 18px;">${estrellas}</span>
            <p>${data.comentario}</p>
          </div>`;
        suma += data.estrellas;
        total++;
      });

      const promedio = Math.round(suma / total);
      promedioEstrellas.textContent = "★".repeat(promedio) + "☆".repeat(5 - promedio);
      totalOpinionesSpan.textContent = total;
      opinionesDiv.innerHTML = html;
    })
    .catch(error => {
      console.error("Error al cargar opiniones públicas:", error);
      opinionesDiv.innerHTML = "<p>Error al mostrar opiniones.</p>";
    });
    
}
cargarOpiniones();



// Ejecutar solo si estamos en inicio.html
if (window.location.pathname.includes("/inicio/inicio.html")) {
  mostrarOpinionesPublicas();
}

});



