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
            style: feature => {
                const revenue = feature.get("revenue");
                let fillColor = "#f2f2f2";

                if (revenue>500000){
                    fillColor="#08306b";
                }
                else if(revenue>250000){
                    fillColor="#2171b5";
                }
                else if(revenue>100000){
                    fillColor="#6baed6";
                }
                else if(revenue > 0){
                    fillColor="#c6dbef";
                }

                return new Style({
                    stroke: new Stroke({
                        color: "#444",
                        width: 1
                    }),
                    fill: new Fill({
                        color: fillColor
                    })
                });
            }
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