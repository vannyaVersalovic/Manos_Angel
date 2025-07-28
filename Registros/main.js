// Verifica que Firebase no haya sido ya inicializado (importante si cargas este archivo más de una vez)
if (!firebase.apps.length) {
  const firebaseConfig = {
    apiKey: "AIzaSyAWD49AKD5nftRxVnQZoqiPZWiUbYnev7M",
    authDomain: "manos-de-angel-b0ce5.firebaseapp.com",
    projectId: "manos-de-angel-b0ce5",
    storageBucket: "manos-de-angel-b0ce5.firebasestorage.app",
    messagingSenderId: "570701301886",
    appId: "1:570701301886:web:f498b2768c612f77d0b02f",
    measurementId: "G-0DNCN6475K"
  };

  firebase.initializeApp(firebaseConfig);
}

// Usa constantes globales solo si aún no están definidas
window.auth = window.auth || firebase.auth();
window.db = window.db || firebase.firestore();


// REGISTRO de cliente
if (document.getElementById('form-register')) {
  const registerForm = document.getElementById('form-register');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = registerForm['email'].value;
    const password = registerForm['password'].value;
    const nombre = registerForm['username'].value;
    const nacimiento = registerForm['birthdate'].value;

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      await db.collection('usuarios').doc(user.uid).set({
        nombre: nombre,
        correo: email,
        fecha_nacimiento: nacimiento,
        rol: 'cliente'
      });

      alert('Registro exitoso! Ahora inicia sesión.');
      registerForm.reset();
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Error en registro:', error.message);
      alert('Error: ' + error.message);
    }
  });
}


if (document.getElementById('form-login')) {
  const loginForm = document.getElementById('form-login');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const doc = await db.collection('usuarios').doc(user.uid).get();

      if (!doc.exists) {
        alert("Usuario no encontrado en la base de datos.");
        await auth.signOut();
        return;
      }

      const data = doc.data();
      const rol = (data.rol || 'cliente').toLowerCase();

      if (email === "cautivepaladarsdb@gmail.com" || rol === 'jefa') {
        window.location.href = '/inicio/jefe.html';
      } else if (rol === 'trabajadora') {
        window.location.href = '/Inicio/trabajadora.html';  // Aquí redirige a trabajadora
      } else if (rol === 'cliente') {
        localStorage.setItem('usuarioNombre', data.nombre);
        window.location.href = '/Inicio/inicio-cliente.html';
      } else {
        alert("Rol no reconocido. Contacta al administrador.");
        await auth.signOut();
      }

    } catch (error) {
      console.error('Error en login:', error.message);
      alert('Error: ' + error.message);
    }
  });
}




// FUNCIÓN para crear reservas (puedes usarla desde otros scripts si quieres)
// FUNCIÓN para crear reservas (puedes usarla desde otros scripts si quieres)
async function crearReserva(reserva) {
  try {
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
      ...(patologia ? { patologia } : {})
};


    // Agregar patología si es masaje
    if (reserva.servicio === "Masajes" && reserva.patologia) {
      reservaData.patologia = {
        tiene: reserva.patologia.tiene === "si",
        detalle: reserva.patologia.detalle || null
      };
    }

    const docRef = await db.collection("reservas").add(reservaData);
    console.log("✅ Reserva creada con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creando reserva:", error);
    throw error;
  }
}

