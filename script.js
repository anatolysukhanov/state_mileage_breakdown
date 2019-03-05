let App = function () {
    this.markers = [];
}

App.prototype.startLoadingAnimation = function () {
    $("body").waitMe({
        text: "Calculating..."
    });
}

App.prototype.stopLoadingAnimation = function () {
    $("body").waitMe("hide");
}

App.prototype.initMap = function () {

    this.map = new google.maps.Map(document.getElementById("map"), {
        zoom: 5,
        center: {lat: 38.357, lng: -100.224},
        styles: [
            {
                "featureType": "administrative.province",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#ff0000"
                    },
                    {
                        "visibility": "on"
                    },
                    {
                        "weight": 2
                    }
                ]
            }
        ],
        streetViewControl: false,
        fullscreenControl: false
    });

    let control = document.getElementById("mileage");

    this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(control);

    this.map.addListener("click", event => {

        if (this.markers.length < 2) {

            this.markers.push(new google.maps.Marker({
                position: event.latLng,
                map: this.map
            }))

            if (this.markers.length == 2) {

                let origin = this.markers[0].position;
                let destination = this.markers[1].position;

                if (control.style.display !== "block") {
                    control.style.display = "block";
                }

                this.displayRoute(origin, destination);
            }
        }
    })

    this.directionsService = new google.maps.DirectionsService();

    this.directionsRenderer = new google.maps.DirectionsRenderer({
        draggable: true,
        preserveViewport: true,
        map: this.map
    });

    this.directionsRenderer.addListener("directions_changed", e => this.calculateMileage());
}

App.prototype.displayRoute = function (origin, destination) {

    this.startLoadingAnimation();

    this.directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
    }, (response, status) => {

        this.stopLoadingAnimation();

        this.markers[0].setMap(null);
        this.markers[1].setMap(null);

        this.markers.length = 0;

        if (status === google.maps.DirectionsStatus.OK) {

            if (!this.directionsRenderer.getMap()) {
                this.directionsRenderer.setMap(this.map);
            }

            this.directionsRenderer.setDirections(response);

        } else {

            this.directionsRenderer.setMap(null);

            document.getElementById("mileage").innerHTML = "Could not display directions due to: " + status;

            this.markers.length = 0;

            origin = undefined;
            destination = undefined;
        }
    });
}

App.prototype.calculateMileage = function () {

    this.startLoadingAnimation();

    let directions = this.directionsRenderer.getDirections();

    let route = [];

    for (let i = 0; i < directions.routes[0].legs[0].steps.length; i++) {
        route.push(directions.routes[0].legs[0].steps[i].polyline.points);
    }

    $.post("script.php", {route: JSON.stringify(route)}, response => {

        this.stopLoadingAnimation();

        if (response.error) {

            document.getElementById("mileage").innerHTML = response.error;

        } else {

            if (response.mileage) {

                document.getElementById("mileage").innerHTML = "";

                for (let row of response.mileage) {
                    document.getElementById("mileage").innerHTML += row.state + " - " + (row.mileage / 1000).toFixed(2) + " mi <br>";
                }
            }
        }

    }, "json");
}