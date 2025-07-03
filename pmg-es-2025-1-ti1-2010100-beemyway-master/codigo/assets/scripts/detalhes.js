let ocorrencia = null;

document.addEventListener("DOMContentLoaded", () => {
    const id = parseInt(localStorage.getItem("ocorrenciaSelecionada"));
    const ocorrencias = JSON.parse(localStorage.getItem("occurrencesData")) || [];
    ocorrencia = ocorrencias.find(o => o.id === id);
    if (!ocorrencia) return;

    document.getElementById("titulo").innerText = ocorrencia.title;
    document.getElementById("descricao").innerText = ocorrencia.description;
    document.getElementById("local").innerText = ocorrencia.location;
    document.getElementById("data").innerText = ocorrencia.date;

    mostrarMapa(ocorrencia.lat, ocorrencia.lng, ocorrencia.title);
});

function mostrarMapa(lat, lng, titulo) {
    const map = L.map('map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([lat, lng]).addTo(map).bindPopup(titulo).openPopup();
}

function abrirMapa() {
    const mapa = document.getElementById("map");
    if (mapa) {
        mapa.scrollIntoView({ behavior: "smooth" });
    }
}
