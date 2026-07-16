import { useEffect, useRef } from "react";

export default function useTruckCanvas(packedBoxes, truckDim){

    const canvasRef=useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const parentRect = canvas.parentElement.getBoundingClientRect();
        
        // Handle High-DPI screens for crisp borders/text
        const dpr = window.devicePixelRatio || 1;
        canvas.width = parentRect.width * dpr;
        canvas.height = parentRect.height * dpr;
        ctx.scale(dpr, dpr);

        const displayW = parentRect.width;
        const displayH = parentRect.height;

        // Clear previous frame
        ctx.clearRect(0, 0, displayW, displayH);

        const { boxes, containerWidth, containerHeight } = packedBoxes;
        if (containerWidth <= 0 || containerHeight <= 0) return;

        // Auto-Scale Logic: Calculate exact zoom needed to fit the truck inside the canvas with padding
        const padding = 30;
        const scale = Math.min((displayW - padding * 2) / containerWidth, (displayH - padding * 2) / containerHeight);

        const drawW = containerWidth * scale;
        const drawH = containerHeight * scale;
        
        // Center the truck drawing perfectly in the canvas
        const offsetX = (displayW - drawW) / 2;
        const offsetY = (displayH - drawH) / 2;

        // Draw Truck Chassis Outline
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.strokeRect(offsetX, offsetY, drawW, drawH);
        
        // Draw Truck Cabin Indicator
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(offsetX - 20, offsetY + (drawH/2) - 30, 20, 60);

        // Draw Internal Floor
        ctx.fillStyle = 'rgba(0,0,0,0.02)';
        ctx.fillRect(offsetX, offsetY, drawW, drawH);

        // Draw Truck Label
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Truck Capacity: ${truckDim.length}" x ${truckDim.width}"`, offsetX, offsetY - 8);

        // Draw Cargo Boxes
        boxes.forEach(box => {
            const bx = offsetX + (box.x * scale);
            const by = offsetY + (box.y * scale);
            const bw = box.w * scale;
            const bh = box.h * scale;

            if (box.fits) {
                ctx.fillStyle = 'rgba(36, 144, 239, 0.5)';
                ctx.strokeStyle = '#1e7acb';
            } else {
                // If it overflows the truck, tint it red
                ctx.fillStyle = 'rgba(255, 99, 132, 0.5)';
                ctx.strokeStyle = '#d32f2f';
            }
            
            ctx.lineWidth = 1.5;
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeRect(bx, by, bw, bh);

            // Draw Box Numbers if size permits
            if (bw > 15 && bh > 15) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(box.id + 1, bx + bw / 2, by + bh / 2);
            }
        });

    }, [packedBoxes, truckDim]); // Re-draw whenever logical boxes or screen layout changes

    return canvasRef;

}