// Claves de LocalStorage
const LS_USERS_KEY = "registeredUsers"; // usuarios que se registren (extra)
const LS_SESSION_KEY = "currentUser";   // sesión activa

// Carga usuarios base desde users.json
async function loadBaseUsers() {
  const res = await fetch("./users.json");
  if (!res.ok) throw new Error("No se pudo cargar users.json");
  return await res.json();
}

// Lee usuarios guardados por registro (localStorage)
function loadRegisteredUsers() {
  const raw = localStorage.getItem(LS_USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Guarda un usuario en localStorage (para registro)
function saveRegisteredUser(newUser) {
  const users = loadRegisteredUsers();

  const exists = users.some(
    (u) => u.email.toLowerCase() === newUser.email.toLowerCase()
  );

  if (exists) return { ok: false, message: "Ese correo ya está registrado." };

  users.push(newUser);
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  return { ok: true };
}

// Login: valida contra users.json + localStorage
async function login(email, password) {
  const baseUsers = await loadBaseUsers();
  const registeredUsers = loadRegisteredUsers();
  const allUsers = [...baseUsers, ...registeredUsers];

  const user = allUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) return { ok: false, message: "Correo o contraseña incorrectos." };

  // Guardar sesión (sin password)
  const sessionUser = { id: user.id ?? Date.now(), name: user.name, email: user.email };
  localStorage.setItem(LS_SESSION_KEY, JSON.stringify(sessionUser));

  return { ok: true, user: sessionUser };
}

// Sesión actual
function getCurrentUser() {
  const raw = localStorage.getItem(LS_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem(LS_SESSION_KEY);
}

// Exponer funciones para usarlas desde login.js / registro.js
window.Auth = {
  login,
  saveRegisteredUser,
  loadRegisteredUsers,
  getCurrentUser,
  logout
};