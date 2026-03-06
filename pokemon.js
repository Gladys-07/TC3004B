(() => {
  "use strict";

  const API_BASE = "https://pokeapi.co/api/v2";
  const PAGE_LIMIT = 20;

  const form = document.getElementById("controlsForm");
  const inputSearch = document.getElementById("q");
  const typeFilter = document.getElementById("typeFilter");
  const sortBy = document.getElementById("sortBy");
  const results = document.getElementById("results");
  const loadMoreBtn = document.getElementById("loadMore");

  const cardTemplate = document.getElementById("pokemon-card-template");
  const skeletonTemplate = document.getElementById("pokemon-card-skeleton");

  let offset = 0;
  let currentPokemons = [];
  let allLoadedPokemons = [];
  let currentType = "";
  let currentSearch = "";
  let currentSort = "id-asc";
  let isTypeMode = false;
  let typePokemonList = [];

  async function init() {
    await loadTypes();
    await loadInitialPokemons();
  }

  async function loadTypes() {
    try {
      const res = await fetch(`${API_BASE}/type`);
      const data = await res.json();

      const excludedTypes = ["unknown", "shadow"];

      data.results.forEach((type) => {
        if (!excludedTypes.includes(type.name)) {
          const option = document.createElement("option");
          option.value = type.name;
          option.textContent = capitalize(type.name);
          typeFilter.appendChild(option);
        }
      });
    } catch (error) {
      console.error("Error al cargar tipos:", error);
    }
  }

  async function loadInitialPokemons() {
    results.innerHTML = "";
    renderSkeletons(PAGE_LIMIT);
    offset = 0;
    allLoadedPokemons = [];
    isTypeMode = false;
    typePokemonList = [];

    const pokemons = await fetchPokemonPage(offset, PAGE_LIMIT);
    clearSkeletons();

    allLoadedPokemons = pokemons;
    currentPokemons = [...pokemons];
    renderPokemons(currentPokemons);

    offset += PAGE_LIMIT;
    updateLoadMoreButton();
  }

  async function fetchPokemonPage(offsetValue, limitValue) {
    try {
      const res = await fetch(`${API_BASE}/pokemon?offset=${offsetValue}&limit=${limitValue}`);
      const data = await res.json();

      const pokemonDetails = await Promise.all(
        data.results.map(async (pokemon) => {
          const detailRes = await fetch(pokemon.url);
          return await detailRes.json();
        })
      );

      return pokemonDetails;
    } catch (error) {
      console.error("Error al cargar Pokémon:", error);
      return [];
    }
  }

  async function fetchPokemonsByType(type) {
    try {
      const res = await fetch(`${API_BASE}/type/${type}`);
      const data = await res.json();

      return data.pokemon.map((item) => item.pokemon);
    } catch (error) {
      console.error("Error al filtrar por tipo:", error);
      return [];
    }
  }

  async function fetchPokemonByNameOrId(value) {
    try {
      const res = await fetch(`${API_BASE}/pokemon/${value.toLowerCase()}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error al buscar Pokémon:", error);
      return null;
    }
  }

  function getPokemonImage(pokemon) {
    return (
      pokemon?.sprites?.other?.["official-artwork"]?.front_default ||
      pokemon?.sprites?.other?.dream_world?.front_default ||
      pokemon?.sprites?.front_default ||
      ""
    );
  }

  function renderPokemons(pokemons) {
    results.innerHTML = "";

    if (pokemons.length === 0) {
      results.innerHTML = `<p class="empty">No se encontraron Pokémon.</p>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    pokemons.forEach((pokemon) => {
      const clone = cardTemplate.content.cloneNode(true);

      const img = clone.querySelector(".card-img");
      const name = clone.querySelector(".pokemon-name");
      const id = clone.querySelector(".pokemon-id");
      const typesContainer = clone.querySelector(".types");
      const height = clone.querySelector(".pokemon-height");
      const weight = clone.querySelector(".pokemon-weight");
      const abilityList = clone.querySelector(".ability-list");
      const statsList = clone.querySelector(".stats-list");

      img.src = getPokemonImage(pokemon);
      img.alt = `Imagen de ${capitalize(pokemon.name)}`;

      name.textContent = capitalize(pokemon.name);
      id.textContent = `#${String(pokemon.id).padStart(4, "0")}`;

      typesContainer.innerHTML = "";
      pokemon.types.forEach((typeInfo) => {
        const span = document.createElement("span");
        span.className = "type-chip";
        span.textContent = capitalize(typeInfo.type.name);
        typesContainer.appendChild(span);
      });

      height.textContent = `Altura: ${pokemon.height}`;
      weight.textContent = `Peso: ${pokemon.weight}`;

      abilityList.innerHTML = "";
      pokemon.abilities.forEach((abilityInfo) => {
        const li = document.createElement("li");
        li.textContent = capitalize(
          abilityInfo.ability.name.replace("-", " ")
        );
        abilityList.appendChild(li);
      });

      statsList.innerHTML = "";
      pokemon.stats.forEach((statInfo) => {
        const li = document.createElement("li");
        li.textContent = `${capitalize(statInfo.stat.name)}: ${statInfo.base_stat}`;
        statsList.appendChild(li);
      });

      fragment.appendChild(clone);
    });

    results.appendChild(fragment);
  }

  function renderSkeletons(amount) {
    results.innerHTML = "";
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < amount; i++) {
      const clone = skeletonTemplate.content.cloneNode(true);
      fragment.appendChild(clone);
    }

    results.appendChild(fragment);
  }

  function clearSkeletons() {
    const skeletons = results.querySelectorAll(".skeleton-card");
    skeletons.forEach((skeleton) => skeleton.remove());
  }

  function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function sortPokemons(pokemons, sortValue) {
    const sorted = [...pokemons];

    if (sortValue === "id-asc") {
      sorted.sort((a, b) => a.id - b.id);
    } else if (sortValue === "id-desc") {
      sorted.sort((a, b) => b.id - a.id);
    } else if (sortValue === "name-asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortValue === "name-desc") {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    }

    return sorted;
  }

  function applyCurrentFilters() {
    let filtered = [...allLoadedPokemons];

    if (currentSearch) {
      filtered = filtered.filter((pokemon) => {
        return (
          pokemon.name.toLowerCase().includes(currentSearch) ||
          String(pokemon.id) === currentSearch
        );
      });
    }

    if (currentType) {
      filtered = filtered.filter((pokemon) =>
        pokemon.types.some((typeInfo) => typeInfo.type.name === currentType)
      );
    }

    filtered = sortPokemons(filtered, currentSort);
    currentPokemons = filtered;
    renderPokemons(currentPokemons);
  }

  async function handleSearchAndFilters() {
    currentSearch = inputSearch.value.trim().toLowerCase();
    currentType = typeFilter.value;
    currentSort = sortBy.value;

    if (currentSearch && !currentType) {
      const pokemon = await fetchPokemonByNameOrId(currentSearch);

      if (!pokemon) {
        renderPokemons([]);
        loadMoreBtn.style.display = "none";
        return;
      }

      currentPokemons = sortPokemons([pokemon], currentSort);
      renderPokemons(currentPokemons);
      loadMoreBtn.style.display = "none";
      return;
    }

    if (currentType) {
      isTypeMode = true;
      renderSkeletons(PAGE_LIMIT);

      const pokemonListByType = await fetchPokemonsByType(currentType);
      typePokemonList = pokemonListByType;

      const detailedPokemons = await Promise.all(
        pokemonListByType.slice(0, PAGE_LIMIT).map(async (pokemon) => {
          const res = await fetch(pokemon.url);
          return await res.json();
        })
      );

      clearSkeletons();
      allLoadedPokemons = detailedPokemons;
      offset = PAGE_LIMIT;

      applyCurrentFilters();
      updateLoadMoreButton();
      return;
    }

    if (!currentSearch && !currentType) {
      await loadInitialPokemons();
      currentSort = sortBy.value;
      applyCurrentFilters();
      return;
    }

    applyCurrentFilters();
  }

  async function loadMorePokemons() {
    if (isTypeMode) {
      const nextBatch = typePokemonList.slice(offset, offset + PAGE_LIMIT);

      if (nextBatch.length === 0) {
        updateLoadMoreButton();
        return;
      }

      renderSkeletons(nextBatch.length);

      const detailedPokemons = await Promise.all(
        nextBatch.map(async (pokemon) => {
          const res = await fetch(pokemon.url);
          return await res.json();
        })
      );

      clearSkeletons();

      allLoadedPokemons = [...allLoadedPokemons, ...detailedPokemons];
      offset += PAGE_LIMIT;

      applyCurrentFilters();
      updateLoadMoreButton();
      return;
    }

    renderSkeletons(PAGE_LIMIT);

    const newPokemons = await fetchPokemonPage(offset, PAGE_LIMIT);

    clearSkeletons();

    allLoadedPokemons = [...allLoadedPokemons, ...newPokemons];
    offset += PAGE_LIMIT;

    applyCurrentFilters();
    updateLoadMoreButton();
  }

  function updateLoadMoreButton() {
    if (isTypeMode) {
      loadMoreBtn.style.display =
        offset < typePokemonList.length ? "inline-block" : "none";
      return;
    }

    if (currentSearch) {
      loadMoreBtn.style.display = "none";
      return;
    }

    loadMoreBtn.style.display = "inline-block";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleSearchAndFilters();
  });

  sortBy.addEventListener("change", async () => {
    currentSort = sortBy.value;

    if (currentSearch || currentType) {
      await handleSearchAndFilters();
    } else {
      applyCurrentFilters();
    }
  });

  loadMoreBtn.addEventListener("click", async () => {
    await loadMorePokemons();
  });

  init();
})();