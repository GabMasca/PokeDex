const container = document.getElementById('pokemon-container');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');

const modal = document.getElementById('pokemon-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.getElementById('close-modal');

let allPokemons = [];

const typeTranslations = {
    normal: 'Normal',
    fire: 'Fogo',
    water: 'Água',
    electric: 'Elétrico',
    grass: 'Planta',
    ice: 'Gelo',
    fighting: 'Lutador',
    poison: 'Veneno',
    ground: 'Terra',
    flying: 'Voador',
    psychic: 'Psíquico',
    bug: 'Inseto',
    rock: 'Pedra',
    ghost: 'Fantasma',
    dragon: 'Dragão',
    dark: 'Sombrio',
    steel: 'Aço',
    fairy: 'Fada'
};

const formatID = (id) => id.toString().padStart(4, '0');

async function getWeaknesses(types) {
    const weaknesses = new Set();

    for (const typeInfo of types) {
        const response = await fetch(typeInfo.type.url);
        const typeData = await response.json();

        typeData.damage_relations.double_damage_from.forEach(weakness => {
            weaknesses.add(weakness.name);
        });
    }

    return Array.from(weaknesses);
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function translateDescription(text) {
    if (!text) return 'Descrição não disponível.';

    return text
        .replace(/\f/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/POK.MON/gi, 'Pokémon')
        .replace(/pokemon/gi, 'Pokémon')
        .trim();
}

async function getPokemons() {
    const loadingScreen = document.getElementById('pokedex-loading');

    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
        const data = await response.json();

        const pokemonPromises = data.results.map(async (pokemon) => {
            const detailsResponse = await fetch(pokemon.url);
            const details = await detailsResponse.json();

            const speciesResponse = await fetch(details.species.url);
            const speciesData = await speciesResponse.json();

            const flavorTextEntry = speciesData.flavor_text_entries.find(
                entry => entry.language.name === 'en'
            );

            const rawDescription = flavorTextEntry
                ? flavorTextEntry.flavor_text
                    .replace(/\f/g, ' ')
                    .replace(/\n/g, ' ')
                : 'Description unavailable.';

            details.description = await translateDescription(rawDescription);

            details.weaknesses = await getWeaknesses(details.types);

            return details;
        });

        allPokemons = await Promise.all(pokemonPromises);

        renderPokemons(allPokemons);

        setTimeout(() => {
            loadingScreen.classList.add('pokedex-open');
        }, 1500);

    } catch (error) {
        console.error('Erro ao consumir a API:', error);
        loadingScreen.innerHTML = '<h2>Erro ao carregar a PokéDex. Tente novamente.</h2>';
    }
}

function renderPokemons(pokemonList) {
    container.innerHTML = '';

    pokemonList.forEach(pokemon => {
        const card = document.createElement('div');
        card.classList.add('pokemon-card');

        const typesHTML = pokemon.types.map(t => {
            const typeNameEN = t.type.name;
            const typeNamePT = typeTranslations[typeNameEN] || typeNameEN;

            return `<span class="type-badge ${typeNameEN}">${typeNamePT}</span>`;
        }).join('');

        const pokemonName = capitalize(pokemon.name);

        card.innerHTML = `
            <div class="img-container">
                <img src="${pokemon.sprites.other['official-artwork'].front_default}" alt="${pokemon.name}">
            </div>
            <p class="pokemon-id">Nº ${formatID(pokemon.id)}</p>
            <h3>${pokemonName}</h3>
            <p class="pokemon-description">${pokemon.description}</p>
            <div class="types-container">${typesHTML}</div>
        `;

        card.addEventListener('click', () => showPokemonModal(pokemon));

        container.appendChild(card);
    });
}

function showPokemonModal(pokemon) {
    const typeColors = {
        normal: '#a4acaf',
        fire: '#fd7d24',
        water: '#4592c4',
        electric: '#eed535',
        grass: '#9bcc50',
        ice: '#51c4e7',
        fighting: '#d56723',
        poison: '#b97fc9',
        ground: '#ab9842',
        flying: '#3dc7ef',
        psychic: '#f366b9',
        bug: '#729f3f',
        rock: '#a38c21',
        ghost: '#7b62a3',
        dragon: '#53a4cf',
        dark: '#707070',
        steel: '#9eb7b8',
        fairy: '#fdb9e9'
    };

    const mainType = pokemon.types[0].type.name;
    const mainColor = typeColors[mainType] || '#999';

    const statLabels = {
        hp: 'HP',
        attack: 'Ataque',
        defense: 'Defesa',
        'special-attack': 'Ataque Especial',
        'special-defense': 'Defesa Especial',
        speed: 'Velocidade'
    };

    const statsHTML = pokemon.stats.map(stat => {
        const statName = statLabels[stat.stat.name] || stat.stat.name;
        const statValue = stat.base_stat;

        return `
            <div class="stat-row">
                <div class="stat-header">
                    <span>${statName}</span>
                    <span>${statValue}</span>
                </div>
                <div class="stat-bar-bg">
                    <div
                        class="stat-bar-fill"
                        style="width:${Math.min(statValue, 150) / 1.5}%; background:${mainColor};"
                    ></div>
                </div>
            </div>
        `;
    }).join('');

    const weaknessesHTML = pokemon.weaknesses.map(weakness => `
        <span class="type-badge ${weakness}">
            ${typeTranslations[weakness] || weakness}
        </span>
    `).join('');

    const pokemonName = capitalize(pokemon.name);

    modalBody.innerHTML = `
        <div class="pokemon-modal-card" style="border-color:${mainColor};">
            <h2>${pokemonName} (#${formatID(pokemon.id)})</h2>

            <div class="modal-layout">
                <div class="modal-left">
                    <img
                        src="${pokemon.sprites.other['official-artwork'].front_default}"
                        alt="${pokemon.name}"
                    >

                    <div class="modal-info">
                        <p><strong>Altura:</strong> ${pokemon.height}</p>
                        <p><strong>Peso:</strong> ${pokemon.weight}</p>
                    </div>

                    <div class="modal-types">
                        ${pokemon.types.map(type => `
                            <span class="type-badge ${type.type.name}">
                                ${typeTranslations[type.type.name]}
                            </span>
                        `).join('')}
                    </div>

                    <div class="modal-weaknesses">
                        <h4>Fraquezas</h4>
                        ${weaknessesHTML}
                    </div>

                    <div class="modal-description">
                        <h4>Descrição</h4>
                        <p>${pokemon.description}</p>
                    </div>
                </div>

                <div class="modal-right">
                    <div class="stats-dashboard">
                        <h3>Status Base</h3>
                        ${statsHTML}
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function filterPokemons() {
    const searchValue = searchInput.value.toLowerCase().trim();
    const selectedType = typeFilter.value;

    const filtered = allPokemons.filter(pokemon => {
        const matchesName =
            pokemon.name.toLowerCase().includes(searchValue);

        const matchesNumber =
            pokemon.id.toString() === searchValue ||
            formatID(pokemon.id).includes(searchValue);

        const matchesSearch =
            matchesName || matchesNumber;

        const matchesType =
            selectedType === 'all' ||
            pokemon.types.some(type => type.type.name === selectedType);

        return matchesSearch && matchesType;
    });

    renderPokemons(filtered);
}

searchInput.addEventListener('input', filterPokemons);
typeFilter.addEventListener('change', filterPokemons);

closeModal.onclick = function () {
    modal.classList.add('hidden');
};

window.onclick = function (e) {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
};

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        modal.classList.add('hidden');
    }
});

getPokemons();