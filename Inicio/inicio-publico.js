document.addEventListener("DOMContentLoaded", () => {
  // Esperar a que Firebase esté listo
  if (!firebase.apps.length) {
    console.error("Firebase no está inicializado");
    return;
  }

  const db = firebase.firestore();

  const opinionesDiv = document.getElementById("opiniones-publicas");
  const promedioEstrellas = document.getElementById("promedio-estrellas");
  const totalOpinionesSpan = document.getElementById("total-opiniones");

  if (!opinionesDiv || !promedioEstrellas || !totalOpinionesSpan) return;

  db.collection("opinion")
    .orderBy("fecha", "desc")
    .limit(10)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        opinionesDiv.innerHTML = "<p>Aún no hay opiniones.</p>";
        return;
      }

      let html = "";
      let total = 0;
      let suma = 0;

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
      console.error("Error al cargar opiniones:", error);
      opinionesDiv.innerHTML = "<p>Error al mostrar opiniones.</p>";
    });
});
