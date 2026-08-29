import { useRef } from "react";
import "ol/ol.css";

import useOpenLayersMap from "../../hooks/geographic/useOpenLayersMap";
import GeoMapLegend from "./GeoMapLegend";

export default function GeoMapCanvas({
  visibleMap,
  isDispatcher,
}) {
  const mapRef = useRef(null);
  const toolTipRef = useRef(null);

  useOpenLayersMap(
    mapRef,
    toolTipRef,
    visibleMap,
    isDispatcher
  );

  return (
    <div className="relative overflow-hidden rounded-lg border bg-background">
      <div
        ref={mapRef}
        className="h-[700px] w-full"
      />

      <div
        ref={toolTipRef}
        className="
          pointer-events-none
          absolute
          z-[1000]
          hidden
          whitespace-nowrap
          rounded-md
          border
          bg-background
          px-3
          py-2
          text-sm
          text-foreground
          shadow-lg
        "
      />

      <GeoMapLegend />
    </div>
  );
}