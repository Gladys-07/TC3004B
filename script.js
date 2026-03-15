const API_URL = "https://pokeapi.co/api/v2/pokemon?limit=1000";

const pokemon1 = crearEstadoPokemon();
const pokemon2 = crearEstadoPokemon();

let turnoActual = 1;
let batallaTerminada = false;
let contadorMovimientos = 0;
const MAX_MOVIMIENTOS = 50;

function crearEstadoPokemon() {
  return {
    nombre: "",
    img: "",
    hp: 100,
    turnosTotales: 0,
    cooldownEspecial: 3,
    cooldownDefEspecial: 2,
    defendiendo: false,
    defensaEspecialActiva: false
  };
}

window.addEventListener("DOMContentLoaded", async () => {
  await cargarAutocompletado();
});

async function cargarAutocompletado() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    const dataList = document.getElementById("pokemon-list");

    data.results.forEach((poke) => {
      const option = document.createElement("option");
      option.value = poke.name;
      dataList.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando autocompletado:", error);
  }
}

async function iniciarBatalla() {
  const input1 = document.getElementById("poke1-input").value.trim().toLowerCase();
  const input2 = document.getElementById("poke2-input").value.trim().toLowerCase();

  if (!input1 || !input2) {
    alert("Selecciona dos Pokémon");
    return;
  }

  if (input1 === input2) {
    alert("Elige dos Pokémon diferentes");
    return;
  }

  try {
    const data1 = await obtenerPokemon(input1);
    const data2 = await obtenerPokemon(input2);

    configurarPokemon(pokemon1, data1, "p1");
    configurarPokemon(pokemon2, data2, "p2");

    turnoActual = 1;
    batallaTerminada = false;
    contadorMovimientos = 0;

    limpiarHistorial();
    actualizarNarrador("¡Comienza la batalla!");
    actualizarBarrasHP();

    document.getElementById("selection-screen").classList.remove("active");
    document.getElementById("winner-screen").classList.remove("active");
    document.getElementById("battle-screen").classList.add("active");

    setTimeout(simularTurno, 1500);
  } catch (error) {
    console.error(error);
    alert("No se pudo cargar alguno de los Pokémon.");
  }
}

async function obtenerPokemon(nombreOId) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(nombreOId)}`);

  if (!response.ok) {
    throw new Error("Pokémon no encontrado");
  }

  return await response.json();
}

function configurarPokemon(obj, data, prefix) {
  obj.nombre = data.name.toUpperCase();
  obj.img =
    data.sprites.other["official-artwork"].front_default ||
    data.sprites.front_default ||
    "";

  obj.hp = 100;
  obj.turnosTotales = 0;
  obj.cooldownEspecial = 3;
  obj.cooldownDefEspecial = 2;
  obj.defendiendo = false;
  obj.defensaEspecialActiva = false;

  document.getElementById(`${prefix}-name`).innerText = obj.nombre;
  document.getElementById(`${prefix}-img`).src = obj.img;
  document.getElementById(`${prefix}-img`).alt = obj.nombre;
}

function simularTurno() {
  if (batallaTerminada) return;

  contadorMovimientos++;

  if (contadorMovimientos > MAX_MOVIMIENTOS) {
    finalizarPorLimite();
    return;
  }

  const atacante = turnoActual === 1 ? pokemon1 : pokemon2;
  const defensor = turnoActual === 1 ? pokemon2 : pokemon1;
  const atacantePrefix = turnoActual === 1 ? "p1" : "p2";
  const defensorPrefix = turnoActual === 1 ? "p2" : "p1";

  const accion = elegirAccion(atacante);
  const falla = Math.random() < 0.2;

  let mensajeTurno = `Turno de ${atacante.nombre}. `;

  if (falla) {
    if (accion === "defensa" || accion === "defensa-especial") {
      atacante.defendiendo = false;
      atacante.defensaEspecialActiva = false;
      mensajeTurno += `Intentó ${nombreAccion(accion)}, pero falló.`;
    } else {
      mensajeTurno += `Usó ${nombreAccion(accion)}, pero falló.`;
    }

    actualizarNarrador(mensajeTurno);
    avanzarCooldowns(atacante);
    cambiarTurno();
    return;
  }

  const resultado = ejecutarAccion(atacante, defensor, accion, atacantePrefix, defensorPrefix);
  mensajeTurno += resultado;

  actualizarNarrador(mensajeTurno);
  actualizarBarrasHP();

  if (defensor.hp <= 0) {
    defensor.hp = 0;
    actualizarBarrasHP();
    batallaTerminada = true;
    setTimeout(() => mostrarGanador(atacante), 1200);
    return;
  }

  avanzarCooldowns(atacante);
  cambiarTurno();
}

function elegirAccion(pokemon) {
  const acciones = ["ataque", "defensa"];

  if (pokemon.cooldownEspecial <= 0) {
    acciones.push("especial");
  }

  if (pokemon.cooldownDefEspecial <= 0) {
    acciones.push("defensa-especial");
  }

  const indice = Math.floor(Math.random() * acciones.length);
  return acciones[indice];
}

function ejecutarAccion(atacante, defensor, accion, atacantePrefix, defensorPrefix) {
  let dano = 0;

  atacante.defendiendo = false;
  atacante.defensaEspecialActiva = false;

  if (accion === "ataque") {
    dano = randomEntre(10, 20);
    dano = aplicarDefensas(defensor, dano);
    defensor.hp = Math.max(0, defensor.hp - dano);
    animarGolpe(defensorPrefix);

    return `usó Ataque normal, hizo ${dano}% de daño y dejó a ${defensor.nombre} con ${defensor.hp}% de vida.`;
  }

  if (accion === "especial") {
    dano = randomEntre(22, 35);
    dano = aplicarDefensas(defensor, dano);
    defensor.hp = Math.max(0, defensor.hp - dano);
    atacante.cooldownEspecial = 3;
    animarGolpe(defensorPrefix);

    return `usó Ataque especial, hizo ${dano}% de daño y dejó a ${defensor.nombre} con ${defensor.hp}% de vida.`;
  }

  if (accion === "defensa") {
    atacante.defendiendo = true;
    return `usó Defensa normal. En el próximo golpe recibirá menos daño.`;
  }

  if (accion === "defensa-especial") {
    atacante.defensaEspecialActiva = true;
    atacante.cooldownDefEspecial = 2;
    return `usó Defensa especial. Puede bloquear completamente el próximo ataque.`;
  }

  return "no hizo nada.";
}

function aplicarDefensas(defensor, dano) {
  if (defensor.defensaEspecialActiva) {
    defensor.defensaEspecialActiva = false;
    return 0;
  }

  if (defensor.defendiendo) {
    defensor.defendiendo = false;
    return Math.floor(dano / 2);
  }

  return dano;
}

function avanzarCooldowns(pokemon) {
  pokemon.turnosTotales++;

  if (pokemon.cooldownEspecial > 0) {
    pokemon.cooldownEspecial--;
  }

  if (pokemon.cooldownDefEspecial > 0) {
    pokemon.cooldownDefEspecial--;
  }
}

function cambiarTurno() {
  turnoActual = turnoActual === 1 ? 2 : 1;
  setTimeout(simularTurno, 1800);
}

function actualizarNarrador(mensaje) {
  document.getElementById("narrator-text").innerText = mensaje;

  const li = document.createElement("li");
  li.innerText = mensaje;
  document.getElementById("log-list").prepend(li);
}

function actualizarBarrasHP() {
  document.getElementById("p1-hp-bar").style.width = `${pokemon1.hp}%`;
  document.getElementById("p1-hp-text").innerText = `${pokemon1.hp}%`;

  document.getElementById("p2-hp-bar").style.width = `${pokemon2.hp}%`;
  document.getElementById("p2-hp-text").innerText = `${pokemon2.hp}%`;
}

function mostrarGanador(ganador) {
  document.getElementById("battle-screen").classList.remove("active");
  document.getElementById("winner-screen").classList.add("active");

  document.getElementById("winner-name").innerText = ganador.nombre;
  document.getElementById("winner-img").src = ganador.img;
  document.getElementById("winner-img").alt = ganador.nombre;
}

function finalizarPorLimite() {
  batallaTerminada = true;

  if (pokemon1.hp === pokemon2.hp) {
    actualizarNarrador("Se alcanzó el límite de movimientos. ¡Empate!");
    setTimeout(() => {
      alert("¡Empate!");
      location.reload();
    }, 1000);
    return;
  }

  const ganador = pokemon1.hp > pokemon2.hp ? pokemon1 : pokemon2;
  actualizarNarrador(`Se alcanzó el límite de movimientos. Gana ${ganador.nombre} por tener más vida.`);
  setTimeout(() => mostrarGanador(ganador), 1200);
}

function limpiarHistorial() {
  document.getElementById("log-list").innerHTML = "";
}

function animarGolpe(prefix) {
  const img = document.getElementById(`${prefix}-img`);
  img.classList.add("shake");

  setTimeout(() => {
    img.classList.remove("shake");
  }, 500);
}

function nombreAccion(accion) {
  if (accion === "ataque") return "Ataque normal";
  if (accion === "especial") return "Ataque especial";
  if (accion === "defensa") return "Defensa normal";
  if (accion === "defensa-especial") return "Defensa especial";
  return accion;
}

function randomEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}