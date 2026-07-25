import { useEffect } from "react";

import Map from "ol/Map";
import View from "ol/View";

import VectorLayer from "ol/layer/Vector";

import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";

import GeoJSON from "ol/format/GeoJSON";

import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";

export default function useOpenLayersMap(mapRef, indiaMap){
    useEffect(()=> {
        if(!indiaMap || !mapRef.current) return;

        const vectorSource = new VectorSource({
            features: new GeoJSON().readFeatures(
                indiaMap,
                {featureProjection: "EPSG:3857"}
            )
        });

        const vectorLayer = new VectorLayer({
            source: vectorSource,
            style: new Style({
                stroke: new Stroke({
                    color: "#8f99a3",
                    width: 1
                }),
                fill: new Fill({
                    color: "#f5f7fa"
                })
            })
        });

        const map = new Map({
            target: mapRef.current,
            layers:[
                vectorLayer
            ],
            view: new View()
        });

        map.getView().fit(vectorSource.getExtent(), {padding:[40,40,40,40]});
        
        return () => map.setTarget(undefined);
    }, [indiaMap]);
}