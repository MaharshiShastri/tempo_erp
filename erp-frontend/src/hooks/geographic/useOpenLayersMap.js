import { useEffect, useState } from "react";

import Map from "ol/Map";
import View from "ol/View";

import VectorLayer from "ol/layer/Vector";

import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";

import GeoJSON from "ol/format/GeoJSON";

import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";

import formatIndianCurrency from "../../utils/formatIndianCurrency";
import Overlay from "ol/Overlay";

export default function useOpenLayersMap(mapRef, toolTipRef, indiaMap){

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

        const overlay = new Overlay({
            element: toolTipRef.current,
            offset: [12, 12],
            positioning: "bottom-left",
            stopEvent: false
        });

        map.addOverlay(overlay);

        map.on("pointermove", (evt) => {
            const feature = map.forEachFeatureAtPixel(evt.pixel, feature=>feature);
            
            if(!feature){
                overlay.setPosition(undefined);
                toolTipRef.current.style.display = "none";
                return;
            }
            overlay.setPosition(evt.coordinate);
            toolTipRef.current.style.display = "block";
            const tooltip = toolTipRef.current;

            tooltip.style.display = "block";
            tooltip.style.background = "var(--bg-surface)";
            tooltip.style.padding = "10px";
            tooltip.style.borderRadius = "8px";
            tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,.15)";
            tooltip.style.border = "1px solid #ddd";

            tooltip.replaceChildren();

            const title = document.createElement("strong");
            title.textContent = feature.get("ST_NM");

            const shipments = document.createElement("div");
            shipments.textContent = `Shipments: ${feature.get("shipments")}`;

            const quantity = document.createElement("div");
            quantity.textContent = `Quantity: ${feature.get("quantity")}`;

            const revenue = document.createElement("div");
            revenue.textContent = `Revenue: ${formatIndianCurrency(feature.get("revenue"))}`;

            tooltip.append(title, document.createElement("br"), shipments, quantity, revenue);
        });

        map.getView().fit(vectorSource.getExtent(), {padding:[40,40,40,40]});
        
        return () => map.setTarget(undefined);
    }, [indiaMap]);
}