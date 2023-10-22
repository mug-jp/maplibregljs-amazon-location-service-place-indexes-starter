import './style.css'
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";
// import { LocationClient, GetPlaceCommand } from "@aws-sdk/client-location";
// import { LocationClient, SearchPlaceIndexForPositionCommand } from "@aws-sdk/client-location";
import { placeToFeatureCollection } from '@aws/amazon-location-utilities-datatypes';
import { withAPIKey } from '@aws/amazon-location-utilities-auth-helper';

const region = import.meta.env.VITE_REGION;
const mapApiKey = import.meta.env.VITE_MAP_API_KEY;
const mapName = import.meta.env.VITE_MAP_NAME;
const placeApiKey = import.meta.env.VITE_PLACE_API_KEY;
const placeName = import.meta.env.VITE_PLACE_NAME;

async function initialize() {
    const authHelper = await withAPIKey(placeApiKey);
    const client = new LocationClient({
        region: region,
        ...authHelper.getLocationClientConfig()
    });

    // SearchPlaceIndexForTextCommand
    const input = {
        IndexName: placeName,
        Text: "Tokyo",
    };
    const command = new SearchPlaceIndexForTextCommand(input);

    // GetPlaceCommand
    // const input = {
    //     IndexName: placeName,
    //     PlaceId: "AQABAFkA9d5eLnjB7XKy9_p0QX3oXD4nrLodHDtIvvzOwEyHbBx9m7LhmUP9WoNILhCrNzsL_DzOmUqagzNOgEabayDDLe6Oxh0rXolepvlZamPS5Q4KX41udsz856yYG6UdXqO6JmoLazImn-Isq2p20k5q_0902-uClFkGTw"
    // };
    // const command = new GetPlaceCommand(input);

    // SearchPlaceIndexForPositionCommand
    // const input = {
    //     IndexName: placeName,
    //     Position: [139.767, 35.681],
    // };
    // const command = new SearchPlaceIndexForPositionCommand(input);

    const response = await client.send(command);
    const featureCollection = placeToFeatureCollection(response, {
        flattenProperties: true
    });

    const map = new maplibregl.Map({
        container: 'map',
        style: `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${mapApiKey}`,
        center: [139.767, 35.681],
        zoom: 11,
    });
    map.addControl(
        new maplibregl.NavigationControl({
            visualizePitch: true,
        })
    );

    map.on('load', function () {
        map.addSource("search-result", {
            type: "geojson",
            data: featureCollection
        });
        map.addLayer({
            'id': "search-result",
            'type': 'circle',
            'source': 'search-result',
            'layout': {},
            'paint': {
                'circle-color': '#007cbf',
                'circle-radius': 10
            }
        });
        map.on('click', 'search-result', (e) => {
            const coordinates = e.lngLat;
            const description = e.features![0].properties['Place.Label'];
            new maplibregl.Popup()
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(map);
        });
        map.on('mouseenter', 'search-result', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'search-result', () => {
            map.getCanvas().style.cursor = '';
        });
    });
}
initialize();