import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, toLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import * as olExtent from 'ol/extent';
const {ElevationService} = await google.maps.importLibrary("elevation");

const morticeLonLat = [6.770, 44.580];
const morticeWebMercator = fromLonLat(morticeLonLat);
const layer = new TileLayer({
  source: new OSM()
});

const elevator = new ElevationService();

const boundingExtent = olExtent.boundingExtent([fromLonLat([6.726,44.598]),fromLonLat([6.813,44.598]),fromLonLat([6.726,44.562]),fromLonLat([6.813,44.563])]);

layer.setExtent(boundingExtent);

const map = new Map({
  target: 'map',
  layers: [
    layer
  ],
  view: new View({
    center: morticeWebMercator,
    zoom: 14
  })
});

let data3D = [];
// coordinates of boundingExtent. format: [lat, lng] eg ;[44.598,6.726]
let extent = layer.getExtent();

/*
bL = [extent[0],extent[1]]
tL = [extent[0],extent[3]]
tR = [extent[2],extent[3]]
bR = [extent[0],extent[1]]
*/

// increment by 1 is too much points. increments by 100 == 5500+ points
async function load3DData(extent, elevator, data3D){
	
  for (let lonIndex = extent[0]; lonIndex < extent[2]; lonIndex+=500) {
    for (let latIndex = extent[1]; latIndex < extent[3]; latIndex+=500) {
      // get points in boundingExtent
      const pointOnMap = [lonIndex, latIndex]; // in WebMercator projection
      const pointOnMapInLonLat = toLonLat(pointOnMap);
      pointOnMapInLonLat[0] = Math.round(pointOnMapInLonLat[0] * 1000)/1000;
      pointOnMapInLonLat[1] = Math.round(pointOnMapInLonLat[1] * 1000)/1000;
      // get elevation for each point
      const loc = {lat: pointOnMapInLonLat[1], lng: pointOnMapInLonLat[0]};
      const elevationRequest = elevator.getElevationForLocations({
        locations: [loc],
      })
      .then(({ results }) => {
        if(results[0]){
          // WORK HERE
          const elevation = Math.round(results[0].elevation);
          data3D.push([pointOnMapInLonLat[0], pointOnMapInLonLat[1], elevation]);
        }
      })
      .catch((e) => {
        console.log("Elevation service failed due to : "+e);
      });
    }
  }
  return await data3D;
}

//load3DData(extent, elevator, data3D);
console.log(data3D);
console.log("extent0: "+extent[0]+", extent1: "+extent[1]+", extent2: "+extent[2]+", extent3: "+extent[3]);

map.on('click', (event) => {

  const pixelLonLat = toLonLat(map.getCoordinateFromPixel(event.pixel));
  pixelLonLat[0] = Math.round(pixelLonLat[0] * 1000)/1000;
  pixelLonLat[1] = Math.round(pixelLonLat[1] * 1000)/1000;

  const location = {lat: pixelLonLat[1], lng: pixelLonLat[0]};
  const elevationRequest = elevator.getElevationForLocations({
    locations: [location],
  })
  .then(({ results }) => {
    if(results[0]){
      // WORK HERE
      const elevation = Math.round(results[0].elevation);
      console.log(elevation);
    }
  })
  .catch((e) => {
    console.log("Elevation service failed due to : "+e);
  });
});
