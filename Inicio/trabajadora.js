const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener("DOMContentLoaded", () => {
  const nombreSpan = document.getElementById("nombre-trabajadora");
  const reservasHoyDiv = document.getElementById("reservas-hoy");
  const btnCerrarSesion = document.getElementById("cerrar-sesion");

  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // Mostrar nombre
        const doc = await db.collection("usuarios").doc(user.uid).get();
        const data = doc.data();

        if (nombreSpan && data?.nombre) {
          nombreSpan.textContent = data.nombre;
        } else {
          nombreSpan.textContent = "Trabajadora";
        }

        // Mostrar reservas del día
        const hoy = new Date().toISOString().split("T")[0];

        const snapshot = await db.collection("reservas")
          .where("trabajadora_id", "==", user.uid)
          .where("fecha", "==", hoy)
          .orderBy("hora")
          .get();

        if (snapshot.empty) {
          reservasHoyDiv.innerHTML = "<div class='text-muted'>No tienes reservas para hoy.</div>";
          return;
        }

        snapshot.forEach(doc => {
          const r = doc.data();
          const item = document.createElement("div");
          item.classList.add("list-group-item", "mb-2");

          item.innerHTML = `
            <strong>⏰ ${r.hora}</strong> - <span>${r.cliente_id}</span><br/>
            <span class="text-primary">${r.servicio} › ${r.subservicio}</span><br/>
            <small class="text-muted">${r.metodo_pago} - $${r.precio?.toLocaleString("es-CL") || "-"}</small>
          `;

          reservasHoyDiv.appendChild(item);
        });

      } catch (error) {
        console.error("❌ Error cargando datos o reservas:", error);
        nombreSpan.textContent = "Trabajadora";
        reservasHoyDiv.innerHTML = "<div class='text-danger'>Error cargando reservas.</div>";
      }
    } else {
      // Si no está logueada, la redirigimos
      window.location.href = "/inicio/inicio.html";
    }
  });

  // Botón cerrar sesión
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
