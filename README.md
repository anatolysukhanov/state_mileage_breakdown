# Site Mileage Breakdown

Calculates mileage by state for driving routes using Google Maps API Directions Service (https://developers.google.com/maps/documentation/javascript/directions) and PostGIS.

![mileage1](https://user-images.githubusercontent.com/7021042/53801325-f06aad00-3f4f-11e9-8da8-3a1777618b9d.png)

![mileage2](https://user-images.githubusercontent.com/7021042/53801332-f3659d80-3f4f-11e9-8ed8-771a54c12212.png)


## Setup

* Download U.S state boundaries as a shapefile (500k = 1:500,000) from https://www.census.gov/geo/maps-data/data/cbf/cbf_state.html

* Use ogr2ogr to create a postgres table

```
ogr2ogr -t_srs EPSG:4326 -f "PostgreSQL" PG:"host=localhost port=5432 dbname=database user=user" cb_2017_us_state_500k.shp -nlt MULTIPOLYGON -nln public.states
```  

* Add an index

```
CREATE INDEX ON states USING GIST (geography(wkb_geometry));
```

## Usage

Click twice on the map to create 2 markers denoting the origin and destination of a route. The mileage is automatically calculated once the second marker has been added. 

You can drag the markers and modify the route by adding waypoints to it.

## Styling

Google Maps API allows to customize the look of the basemap (see https://developers.google.com/maps/documentation/javascript/styling). 

To highlight the state boundaries I used this:

```
[
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
]
``` 

## Demo

https://anatolysukhanov.com/mileage/