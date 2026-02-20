const form = document.getElementById("loginForm");
const msg = document.getElementById("loginMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // limpiar mensaje
  msg.textContent = "";
  msg.style.color = "";

  // tomar valores según tu HTML
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("pass").value;

  // validación simple
  if (!email || !password) {
    msg.textContent = "Completa correo y contraseña.";
    msg.style.color = "crimson";
    return;
  }

  try {
    const res = await window.Auth.login(email, password);

    if (!res.ok) {
      msg.textContent = res.message;
      msg.style.color = "crimson";
      return;
    }

    msg.textContent = "Login correcto ✅";
    msg.style.color = "green";

    // redirigir
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 400);
  } catch (err) {
    msg.textContent = "Error cargando users.json. Abre con Live Server.";
    msg.style.color = "crimson";
    console.error(err);
  }
});