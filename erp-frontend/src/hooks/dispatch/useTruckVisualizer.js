import { useMemo, useState } from "react";

export default function useTruckVisualizer(products, unit) {

    const [truckDim, setTruckDim] = useState({width:90, length:240});

    const packedBoxes = useMemo(() => {
        const boxes = [];
        
        let currentX=0;
        let currentY=0;
        let rowMaxHeight=0;

        const containerWidth = Number(truckDim.length)||0;
        const containerHeight = Number(truckDim.width)||0;

        products.forEach((p,i)=>{

            let w = Number(p.width)||0;
            let h = Number(p.depth)||0;

            if(unit==="cm"){
                w/=2.54;
                h/=2.54;
            }

            if(w<=0||h<=0) return;

            if(currentX+w>containerWidth){
                currentX=0;
                currentY+=rowMaxHeight;
                rowMaxHeight=0;
            }

            const fits = currentY+h<=containerHeight && w<=containerWidth;
            boxes.push({id:i, x:currentX, y:currentY, w, h, fits});
            currentX+=w;
            rowMaxHeight=Math.max(rowMaxHeight,h);

        });

        return {boxes, containerWidth, containerHeight};

    },[products, truckDim, unit]);

    return {truckDim, setTruckDim, packedBoxes};

}