// Variáveis globais
let map;
let startMarker;
let destinationMarker;
let startPoint = null;
let destination = null;
let routingControl = null;
let isSettingStartPoint = false;
let isSettingDestination = false;
let occurrenceMarker = null;

// Inicializa o mapa quando a página carrega Davi Lage Braga
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    document.getElementById('searchStartPoint').addEventListener('click', function() {
        searchLocation('startPoint', true);
    });
    document.getElementById('searchDestination').addEventListener('click', function() {
        searchLocation('destination', false);
    });
    document.getElementById('setStartOnMap').addEventListener('click', function() {
        isSettingStartPoint = true;
        isSettingDestination = false;
        document.getElementById('status').textContent = 'Clique no mapa para definir o ponto de partida';
    });
    document.getElementById('setDestOnMap').addEventListener('click', function() {
        isSettingDestination = true;
        isSettingStartPoint = false;
        document.getElementById('status').textContent = 'Clique no mapa para definir o destino';
    });
    document.getElementById('useMyLocation').addEventListener('click', getUserLocation);
    document.getElementById('calculateRoute').addEventListener('click', calculateRoute);
    document.getElementById('clearRoute').addEventListener('click', clearAll);
    document.getElementById('startPoint').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLocation('startPoint', true);
        }
    });
    document.getElementById('destination').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLocation('destination', false);
        }
    });
});

function initMap() {
    if (typeof L === 'undefined') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        script.onload = function() {
            const routingScript = document.createElement('script');
            routingScript.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js';
            routingScript.onload = initializeMap;
            document.body.appendChild(routingScript);
            const routingCss = document.createElement('link');
            routingCss.rel = 'stylesheet';
            routingCss.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
            document.head.appendChild(routingCss);
        };
        document.body.appendChild(script);
    } else {
        initializeMap();
    }
}

function initializeMap() {
    map = L.map('map').setView([-15.7975, -47.8919], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.on('click', function(e) {
        if (isSettingStartPoint) {
            setStartPoint(e.latlng);
            document.getElementById('startPoint').value = e.latlng.lat.toFixed(6) + ', ' + e.latlng.lng.toFixed(6);
            isSettingStartPoint = false;
        } else if (isSettingDestination) {
            setDestination(e.latlng);
            document.getElementById('destination').value = e.latlng.lat.toFixed(6) + ', ' + e.latlng.lng.toFixed(6);
            isSettingDestination = false;
        }
    });
    document.getElementById('status').textContent = 'Defina o ponto de partida e o destino para calcular a rota';
}

function searchLocation(fieldId, isStartPoint) {
    const query = document.getElementById(fieldId).value.trim();
    if (!query) {
        document.getElementById('status').textContent = 'Por favor, digite um local para buscar';
        return;
    }
    document.getElementById('status').textContent = 'Buscando local...';
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                document.getElementById('status').textContent = 'Local não encontrado. Tente outro termo.';
                return;
            }
            const result = data[0];
            const latLng = L.latLng(parseFloat(result.lat), parseFloat(result.lon));
            if (isStartPoint) {
                setStartPoint(latLng);
                document.getElementById('startPoint').value = result.display_name || query;
            } else {
                setDestination(latLng);
                document.getElementById('destination').value = result.display_name || query;
            }
            map.setView(latLng, 15);
            document.getElementById('status').textContent = 'Local encontrado!';
        })
        .catch(error => {
            console.error('Erro na busca:', error);
            document.getElementById('status').textContent = 'Erro ao buscar local. Tente novamente.';
        });
}

function setStartPoint(position) {
    startPoint = position;
    updateStartMarker(startPoint);
    document.getElementById('status').textContent = 'Ponto de partida definido! Agora defina o destino.';
}

function setDestination(position) {
    destination = position;
    updateDestinationMarker(destination);
    document.getElementById('status').textContent = 'Destino definido! Clique em "Calcular Rota".';
}

function updateStartMarker(position) {
    if (startMarker) {
        map.removeLayer(startMarker);
    }
    startMarker = L.marker(position, {
        title: 'Ponto de Partida',
        alt: 'Ponto de partida',
        riseOnHover: true
    }).addTo(map)
    .bindPopup('Ponto de Partida');
    if (startMarker._icon) {
        startMarker._icon.classList.add('start-marker');
    }
}

function updateDestinationMarker(position) {
    if (destinationMarker) {
        map.removeLayer(destinationMarker);
    }
    destinationMarker = L.marker(position, {
        title: 'Destino',
        alt: 'Destino selecionado',
        riseOnHover: true
    }).addTo(map)
    .bindPopup('Destino');
}

function getUserLocation() {
    if (navigator.geolocation) {
        document.getElementById('status').textContent = 'Obtendo sua localização...';
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLocation = L.latLng(
                    position.coords.latitude,
                    position.coords.longitude
                );
                setStartPoint(userLocation);
                document.getElementById('startPoint').value = 'Minha Localização';
                map.setView(userLocation, 15);
            },
            function(error) {
                let errorMessage;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Permissão negada pelo usuário.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Localização indisponível.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Tempo de espera excedido.";
                        break;
                    case error.UNKNOWN_ERROR:
                        errorMessage = "Erro desconhecido.";
                        break;
                }
                document.getElementById('status').textContent = 'Erro: ' + errorMessage;
            }
        );
    } else {
        document.getElementById('status').textContent = 'Geolocalização não é suportada pelo seu navegador.';
    }
}

function calculateRoute() {
    if (!startPoint) {
        document.getElementById('status').textContent = 'Por favor, defina o ponto de partida primeiro.';
        return;
    }
    if (!destination) {
        document.getElementById('status').textContent = 'Por favor, defina o destino.';
        return;
    }
    document.getElementById('status').textContent = 'Calculando rota...';
    if (routingControl) {
        map.removeControl(routingControl);
    }
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(startPoint.lat, startPoint.lng),
            L.latLng(destination.lat, destination.lng)
        ],
        routeWhileDragging: true,
        showAlternatives: true,
        addWaypoints: true,
        draggableWaypoints: true,
        fitSelectedRoutes: true,
        lineOptions: {
            styles: [{color: '#4285F4', opacity: 0.7, weight: 5}]
        },
        collapsible: true
    }).addTo(map);
    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        const route = routes[0];
        const distance = (route.summary.totalDistance / 1000).toFixed(1);
        const time = (route.summary.totalTime / 60).toFixed(0);
        document.getElementById('status').textContent =
            `Rota calculada! Distância: ${distance} km, Tempo estimado: ${time} minutos`;
    });
    routingControl.on('routingerror', function(e) {
        document.getElementById('status').textContent = 'Erro ao calcular rota: ' + e.error.message;
    });
}

function clearAll() {
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    document.getElementById('startPoint').value = '';
    document.getElementById('destination').value = '';
    startPoint = null;
    destination = null;
    if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
    }
    if (destinationMarker) {
        map.removeLayer(destinationMarker);
        destinationMarker = null;
    }
    isSettingStartPoint = false;
    isSettingDestination = false;
    document.getElementById('status').textContent = 'Tudo limpo. Defina novos pontos de partida e destino.';
}

const sampleOccurrences = [
    {
        id: 1,
        title: "Furto de bicicleta",
        description: "Bicicleta foi furtada na região central",
        type: "bicicleta",
        location: "Centro",
        date: "2025-06-05",
        lat: -19.918842,
        lng: -43.937973
    },
    {
        id: 2,
        title: "Acidente de trânsito",
        description: "Colisão entre dois veículos no Bairro Oswaldo Barbosa Pena II",
        type: "acidente",
        location: "Oswaldo Barbosa Pena II",
        date: "2025-06-05",
        lat: -20.000316,
        lng: -43.851241
    },
    {
        id: 3,
        title: "Obras na via",
        description: "Obras de recapeamento no bairro Savassi",
        type: "obras",
        location: "Savassi",
        date: "2025-06-05",
        lat: -19.939935,
        lng: -43.933135
    },
    {
        id: 4,
        title: "Roubo de veículo",
        description: "Carro foi roubado no estacionamento do shopping Oiapoque",
        type: "carro",
        location: "Shopping Oiapoque",
        date: "2025-06-05",
        lat: -19.91318,
        lng: -43.93914
    }
];

const STORAGE_KEY = 'occurrencesData';

// Funções de gerenciamento do LocalStorage

function loadOccurrences() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        return JSON.parse(storedData);
    }
    saveOccurrences(sampleOccurrences);
    return sampleOccurrences;
}

function saveOccurrences(occurrences) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(occurrences));
}

function addOccurrence(newOccurrence) {
    const occurrences = loadOccurrences();
    // Gera um ID único
    const maxId = occurrences.reduce((max, item) => Math.max(max, item.id), 0);
    newOccurrence.id = maxId + 1;
    occurrences.push(newOccurrence);
    saveOccurrences(occurrences);
    return newOccurrence;
}

function removeOccurrence(id) {
    const occurrences = loadOccurrences();
    const filtered = occurrences.filter(occ => occ.id !== id);
    saveOccurrences(filtered);
    return filtered;
}

function verMais(id) {
    localStorage.setItem("ocorrenciaSelecionada", id);
    window.location.href = "detalhes.html";
}

function displayOccurrences(occurrences) {
    const listElement = document.getElementById('occurrencesList');
    listElement.innerHTML = '';
    
    const sortedOccurrences = [...occurrences].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedOccurrences.forEach(occurrence => {
        const item = document.createElement('li');
        item.className = 'occurrence-item';
        item.innerHTML = `
            <div class="occurrence-header">
                <h3 class="occurrence-title">${occurrence.title}</h3>
                <span class="occurrence-type type-${occurrence.type}">${getTypeName(occurrence.type)}</span>
            </div>
            <div class="occurrence-details">
                <p>${occurrence.description}</p>
                <p><strong>Local:</strong> ${occurrence.location}</p>
            </div>
            <div class="occurrence-date">${formatDate(occurrence.date)}</div>
            <div class="occurrence-actions-bottom">
                <button onclick="verMais(${occurrence.id})">Ver mais</button>
                <button onclick="removeOccurrenceAndRefresh(${occurrence.id})" class="delete-btn">Remover</button>
            </div>
        `;
        listElement.appendChild(item);
    });
}


function removeOccurrenceAndRefresh(id) {
    if (confirm('Tem certeza que deseja remover esta ocorrência?')) {
        const updatedOccurrences = removeOccurrence(id);
        displayOccurrences(updatedOccurrences);
    }
}

function focusOccurrenceOnMap(lat, lng, title) {
    if (!map) return;
    const position = L.latLng(lat, lng);
    map.setView(position, 16);
    if (occurrenceMarker) {
        map.removeLayer(occurrenceMarker);
    }
    occurrenceMarker = L.marker(position)
        .addTo(map)
        .bindPopup(`<strong>${title}</strong>`)
        .openPopup();
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        mapContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

function getTypeName(type) {
    const typeNames = {
        'bicicleta': 'Bicicleta',
        'carro': 'Carro',
        'acidente': 'Acidente',
        'obras': 'Obras'
    };
    return typeNames[type] || type;
}

function filterOccurrences() {
    const occurrences = loadOccurrences();
    const searchText = document.getElementById('searchOccurrences').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    
    const filtered = occurrences.filter(occurrence => {
        const matchesSearch = occurrence.title.toLowerCase().includes(searchText) ||
            occurrence.description.toLowerCase().includes(searchText) ||
            occurrence.location.toLowerCase().includes(searchText);
        const matchesType = filterType === 'all' || occurrence.type === filterType;
        return matchesSearch && matchesType;
    });
    
    displayOccurrences(filtered);
}
function addNewOccurrenceFromForm() {
  
    const title = document.getElementById('newOccurrenceTitle').value;
    const description = document.getElementById('newOccurrenceDescription').value;
    const type = document.getElementById('newOccurrenceType').value;
    const location = document.getElementById('newOccurrenceLocation').value;
    const date = document.getElementById('newOccurrenceDate').value;
    const lat = parseFloat(document.getElementById('newOccurrenceLat').value);
    const lng = parseFloat(document.getElementById('newOccurrenceLng').value);
    
    if (!title || !description || !type || !location || !date || isNaN(lat) || isNaN(lng)) {
        alert('Por favor, preencha todos os campos corretamente');
        return;
    }
    
    const newOccurrence = {
        title,
        description,
        type,
        location,
        date,
        lat,
        lng
    };
    
    addOccurrence(newOccurrence);
    displayOccurrences(loadOccurrences());
    
   
    document.getElementById('occurrenceForm').reset();
    alert('Ocorrência adicionada com sucesso!');
}


document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('occurrencesList')) {
        displayOccurrences(loadOccurrences());
        document.getElementById('searchOccurrences').addEventListener('input', filterOccurrences);
        document.getElementById('filterType').addEventListener('change', filterOccurrences);
    }

    const form = document.getElementById('occurrenceForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            addNewOccurrenceFromForm();
        });
    }
});

// Davi - Favoritar Rotas - Sprint 2

// Variável global para a chave do localStorage
const FAVORITES_KEY = 'saved_routes_favorites';

// Função principal para favoritar a rota atual
function favouriteRoute() {
    // Verificação básica - pontos definidos
    if (!startPoint || !destination) {
        alert('Erro: Defina o ponto de partida e destino antes de favoritar!');
        return;
    }

    try {
        // Cria o objeto da rota atual
        const routeData = {
            id: Date.now(), // ID único
            timestamp: new Date().toISOString(),
            start: {
                coords: { lat: startPoint.lat, lng: startPoint.lng },
                name: document.getElementById('startPoint').value || 'Ponto de partida'
            },
            destination: {
                coords: { lat: destination.lat, lng: destination.lng },
                name: document.getElementById('destination').value || 'Destino'
            }
        };

        // Recupera favoritos existentes
        const existingFavorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
        
        // Adiciona a nova rota
        existingFavorites.push(routeData);
        
        // Salva no localStorage
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(existingFavorites));
        
        // Feedback ao usuário
        alert('Rota salva com sucesso nos favoritos!');
        
        // DEBUG: Mostra no console o que foi salvo
        console.log('Rota salva:', routeData);
        console.log('Todos favoritos:', existingFavorites);
        
    } catch (error) {
        console.error('Erro ao salvar rota:', error);
        alert('Erro ao salvar a rota. Verifique o console para detalhes.');
    }
}

function initFavorites() {
    const favButton = document.getElementById('favoriteRouteBtn');
    if (favButton) {
        favButton.addEventListener('click', favouriteRoute);
        console.log('Botão de favoritos inicializado!');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initFavorites();
});


// Laura Noronha Lara - Exibir favoritos - Sprint 2

// Função principal que carrega e exibe as rotas favoritas salvas no localStorage
function displayFavorites() {
    // Chave usada para armazenar as rotas favoritas no localStorage
    const favouriteRoute = 'saved_routes_favorites';
    
    // Container HTML onde os favoritos serão exibidos
    const favoritesContainer = document.getElementById('favorites-container');
    
    // Obtém as rotas favoritas do localStorage ou um array vazio se não existirem
    const favorites = JSON.parse(localStorage.getItem(favouriteRoute)) || [];

    // Se não houver rotas favoritas, exibe uma mensagem informativa
    if (favorites.length === 0) {
        favoritesContainer.innerHTML = `
            <div class="empty-message">
                <p>Você ainda não tem nenhuma rota favorita</p>
            </div>
        `;
        return; // Encerra a função aqui
    }
    
    // Para cada rota favorita, cria um card com suas informações
    favorites.forEach(route => {
        // Converte o timestamp da rota para um formato legível
        const date = new Date(route.timestamp);
        const formattedDate = date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR');

        // Cria um elemento HTML para a rota
        const routeElement = document.createElement('div');
        routeElement.className = 'route-card';
        
        // Preenche o HTML do card com os dados da rota
        routeElement.innerHTML = `
            <div class="route-header">
                <h3 class="route-title">Rota #${route.id}</h3>
                <span class="route-date">Salva em ${formattedDate}</span>
            </div>
            <div class="route-details">
                <div class="route-point">
                    <span class="tag">Partida:</span>
                    <span class="endereco">${route.start.name}</span>
                </div>
                <div class="route-point">
                    <span class="tag">Destino:</span>
                    <span class="endereco">${route.destination.name}</span>
                </div>
            </div>
            <div class="buttons-container">
                <button class="btn btn-load" data-id="${route.id}">Carregar Rota</button>
                <button class="btn btn-delete" data-id="${route.id}">Remover</button>
            </div>
        `;

        // Adiciona o card ao container de favoritos
        favoritesContainer.appendChild(routeElement);
    });}

    
// Laura Noronha Lara - Exibir favoritos - Sprint 2


// Função para carregar e exibir as rotas favoritas
function displayFavorites() {
    const favouriteRoute = 'saved_routes_favorites';
    const favoritesContainer = document.getElementById('favorites-container');
    const favorites = JSON.parse(localStorage.getItem(favouriteRoute)) || [];


    if (favorites.length === 0) {
        favoritesContainer.innerHTML = `
                    <div class="nenhumaRota">
                        <p>Você ainda não tem nenhuma rota favorita</p>
                    </div>
                `;
        return;
    }
    // Cria um card para cada rota
    favorites.forEach(route => {
        const date = new Date(route.timestamp);
        const formattedDate = date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR');

        const routeElement = document.createElement('div');
        routeElement.className = 'route-card';
        routeElement.innerHTML = `
                    <div class="route-header">
                        <h3 class="route-title">Rota #${route.id}</h3>
                        <span class="route-date">Salva em ${formattedDate}</span>
                    </div>
                    <div class="route-details">
                        <div class="route-point">
                            <span class="tag">Partida:</span>
                            <span class="endereco">${route.start.name}</span>
                        </div>
                        <div class="route-point">
                            <span class="tag">Destino:</span>
                            <span class="endereco">${route.destination.name}</span>
                        </div>
                    </div>
                    <div class="buttons-container">
                        <button class="btn btn-load" data-id="${route.id}">Carregar Rota</button>
                        <button class="btn btn-delete" data-id="${route.id}">Remover</button>
                    </div>
                `;

        favoritesContainer.appendChild(routeElement);
    });

    // Adiciona os event listeners aos botões
    addButtonEventListeners();
}

// Função para adicionar os event listeners aos botões de carregar e remover rotas

function addButtonEventListeners() {
    // Botão Carregar Rota
    document.querySelectorAll('.btn-load').forEach(button => {
        button.addEventListener('click', function () {
            const routeId = parseInt(this.getAttribute('data-id'));
            loadRoute(routeId);
        });
    });

    // Botão Remover
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function () {
            const routeId = parseInt(this.getAttribute('data-id'));
            deleteRoute(routeId);
        });
    });
}


// Função para deletar uma rota
function deleteRoute(routeId) {

    let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    favorites = favorites.filter(r => r.id !== routeId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    displayFavorites();

}

document.addEventListener('DOMContentLoaded', displayFavorites);

// Função para vincular as páginas de modais

const params = new URLSearchParams(window.location.search);

const modalId = params.get("id");

// Função para compartilhar rotas

  // ID do botão de compartilhamento
        const shareRoute = document.getElementById('shareRouteBtn');

        shareRoute.addEventListener('click', function() {

            const idRotaAtual = `${startPoint.lat}`+`,${startPoint.lng}`+`,${destination.lat}`+`,${destination.lng}`;

            const paginaDestino = 'compartilhamento.html';

            const urlCompleta = `${paginaDestino}?id=${idRotaAtual}`;

            window.location.href = urlCompleta;
        });
