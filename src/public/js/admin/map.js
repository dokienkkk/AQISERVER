var mapOptions = {
    center: [21.0245, 105.84117], //tọa độ của Hà Nội
    zoom: 10 //level zoom (số lần zoom)
}

//create map
var map = new L.map('map', mapOptions);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    //minZoom: 2,
    minZoom: 10,
}).addTo(map);


//vẽ bản đồ Hà Nội
L.geoJSON(geojsonHaNoi, {
    style: {
        // fillColor: none,
        weight: 2,
        opacity: 0,
        color: 'black',
        dashArray: '3',
        // fillOpacity: 0.7
    }
}).addTo(map);

// Vẽ bản đồ mật độ dân số các quận/huyện/thị xã
for (let data of geojson_data) {
    L.geoJSON(data.geojson, {
        style: {
            fillColor: data.color,
            // fillColor: white,
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        }
    }).addTo(map);
}

for (let location of locations) {
    var myIcon = L.divIcon({
        iconSize: "auto",
        html: `
        <div class="">
            <img style="width: 20px;height: 20px;background-color: hsl(0, 0%, 90%);border-radius: 12px;z-index:9999;" src="/img/flagred.png">
        </div>
    `
    });
    L.marker([location.lat, location.lng], { icon: myIcon }).addTo(map);
}



//map coordinate display
map.on('click', (e) => {
    // $(".coordinate").html(`Lat: ${e.latlng.lat} Lng: ${e.latlng.lng}`)
    $("#add__station--lat").val(`${e.latlng.lat}`)
    $("#add__station--lng").val(`${e.latlng.lng}`)
})

//leaflet search
L.Control.geocoder().addTo(map);

// Load Leaflet in Modal Fix Bug
$('#modalAddStation').on('show.bs.modal', function () {
    setTimeout(function () {
        map.invalidateSize();
    }, 500);
});