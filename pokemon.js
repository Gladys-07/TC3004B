// pokemon.js
(() => {
  "use strict";

  const API_BASE = "https://pokeapi.co/api/v2";
  const form = document.getElementById("pokeForm");
  const input = document.getElementById("pokeInput");
  const randomBtn = document.getElementById("randomBtn");

  const statusEl = document.getElementById("status");
  const imgEl = document.getElementById("pokeImg");
  const nameEl = document.getElementById("pokeName");
  const idEl = document.getElementById("pokeId");

  function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.style.color = isError ? "#a40000" : "";
  }

  function capitalize(s) {
    return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
  }

  async function fetchPokemon(nameOrId) {
    const key = String(nameOrId).trim().toLowerCase();
    const url = `${API_BASE}/pokemon/${encodeURIComponent(key)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function getBestImage(poke) {
    return (
      poke?.sprites?.other?.["official-artwork"]?.front_default ||
      poke?.sprites?.other?.dream_world?.front_default ||
      poke?.sprites?.front_default ||
      ""
    );
  }

  function renderPokemon(poke) {
    const bestImg = getBestImage(poke);

    nameEl.textContent = capitalize(poke.name);
    idEl.textContent = `#${String(poke.id).padStart(4, "0")}`;

    if (bestImg) {
      imgEl.src = bestImg;
      imgEl.alt = `Imagen de ${capitalize(poke.name)}`;
      imgEl.style.display = "block";
    } else {
      imgEl.src = "";
      imgEl.alt = "";
      imgEl.style.display = "none";
    }
  }

  async function loadPokemon(value) {
    if (!value) {
      setStatus("Escribe un nombre o ID.", true);
      return;
    }

    try {
      setStatus("Cargando...");
      const poke = await fetchPokemon(value);
      renderPokemon(poke);
      setStatus("Listo ✅");
    } catch (e) {
      imgEl.style.display = "none";
      nameEl.textContent = "—";
      idEl.textContent = "";
      setStatus("No se encontró ese Pokémon. Prueba con 'pikachu' o '25'.", true);
    }
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    loadPokemon(input.value);
  });

  randomBtn.addEventListener("click", () => {
    
    const id = Math.floor(Math.random() * 151) + 1;
    input.value = String(id);
    loadPokemon(id);
  });

  // Carga inicial (opcional)
  loadPokemon("pikachu");
})();