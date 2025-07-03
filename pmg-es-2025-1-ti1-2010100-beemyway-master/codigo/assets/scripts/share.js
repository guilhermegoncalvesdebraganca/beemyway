       //Inicializar o mapa
        const map = L.map('map').setView([-19.9167, -43.9333], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
       
       // Ler a url
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        // Separar o id
        const idCoordenadas = urlParams.get('id');

        let startPoint = null;
        let destination = null;

        if (idCoordenadas) {

            // Splitar o id
            const coordenadasArray = idComCoordenadas.split(',');

            // Verificação
            if (coordenadasArray.length === 4) {

                // Atribuir pontos
                startPoint = {
                    lat: parseFloat(coordenadasArray[0]),
                    lng: parseFloat(coordenadasArray[1])
                };
                destination = {
                    lat: parseFloat(coordenadasArray[2]),
                    lng: parseFloat(coordenadasArray[3])
                };

                console.log("Ponto de Início:", startPoint);
                console.log("Ponto de Destino:", destination);

                // Criar a Rota
                L.Routing.control({
                    waypoints: [
                        L.latLng(startPoint.lat, startPoint.lng),
                        L.latLng(destination.lat, destination.lng)
                    ],
                    routeWhileDragging: true,
                    language: 'pt-BR',
                    showAlternatives: true
                }).addTo(map);

            //Função para centralizar o mapa
            if (startPoint && destination) {
                    map.fitBounds([
                        [startPoint.lat, startPoint.lng],
                        [destination.lat, destination.lng]
                    ]);
                }

            } else {
                console.error("Formato de ID inválido. Esperado: lat1,lng1,lat2,lng2");
            }
        } else {
            console.warn("Nenhum parâmetro 'id' encontrado na URL.");
        }