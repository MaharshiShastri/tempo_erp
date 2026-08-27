import { useEffect, useRef } from "react";

export default function useTruckCanvas(
    packedBoxes,
    truckDim,
    view = "top"
) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const parent = canvas.parentElement;

        if (!parent) return;

        const rect = parent.getBoundingClientRect();

        const displayWidth = rect.width;
        const displayHeight = rect.height;

        if (displayWidth <= 0 || displayHeight <= 0) return;

        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(displayWidth * dpr);
        canvas.height = Math.floor(displayHeight * dpr);

        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.clearRect(0, 0, displayWidth, displayHeight);

        const {
            boxes = [],
            rejectedBoxes = [],
            containerLength = 0,
            containerWidth = 0,
            containerHeight = 0,
        } = packedBoxes || {};

        if (
            containerLength <= 0 ||
            containerWidth <= 0 ||
            containerHeight <= 0
        ) {
            ctx.fillStyle = "#64748b";
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";

            ctx.fillText(
                "Enter valid truck dimensions",
                displayWidth / 2,
                displayHeight / 2
            );

            return;
        }

        /*
         * ---------------------------------------------------------
         * TRUCK GEOMETRY
         * ---------------------------------------------------------
         *
         * Cabin is visual only.
         * It is NOT part of the cargo dimensions.
         */

        const cabinLength = Math.max(containerLength * 0.22, 60);

        const totalTruckLength = containerLength + cabinLength;

        const padding = 40;

        let projectionWidth;
        let projectionHeight;

        if (view === "top") {
            projectionWidth = totalTruckLength;
            projectionHeight = containerWidth;
        } else {
            projectionWidth = totalTruckLength;
            projectionHeight = containerHeight;
        }

        const scale = Math.min((displayWidth - padding * 2) / projectionWidth, (displayHeight - padding * 2) / projectionHeight);

        const drawWidth = projectionWidth * scale;

        const drawHeight = projectionHeight * scale;

        const offsetX = (displayWidth - drawWidth) / 2;

        const offsetY = (displayHeight - drawHeight) / 2;

        /*
         * ---------------------------------------------------------
         * BACKGROUND
         * ---------------------------------------------------------
         */

        ctx.fillStyle = "#e2e8f0";

        ctx.fillRect(0, 0, displayWidth, displayHeight);

        /*
         * ---------------------------------------------------------
         * LABEL
         * ---------------------------------------------------------
         */

        ctx.fillStyle = "#334155";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";

        ctx.fillText(view === "top" ? "TOP VIEW" : "SIDE VIEW", displayWidth / 2,20);

        /*
         * ---------------------------------------------------------
         * TRUCK BODY
         * ---------------------------------------------------------
         */

        const cargoX = offsetX + cabinLength * scale;

        const cargoWidth = containerLength * scale;

        const cargoHeight = projectionHeight * scale;

        /*
         * Cargo body
         */

        ctx.fillStyle = "#f8fafc";

        ctx.fillRect(cargoX, offsetY, cargoWidth, cargoHeight);

        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cargoX, offsetY);
        ctx.lineTo(cargoX, offsetY + cargoHeight);
        ctx.stroke();
        ctx.strokeRect(cargoX, offsetY, cargoWidth, cargoHeight);

        /*
         * ---------------------------------------------------------
         * DRIVER CABIN
         * ---------------------------------------------------------
         */

        const cabinX = offsetX;

        const cabinWidth =
            cabinLength * scale;

        if (view === "top") {
            drawTopCabin(
                ctx,
                cabinX,
                offsetY,
                cabinWidth,
                cargoHeight
            );
        } else {
            drawSideCabin(
                ctx,
                cabinX,
                offsetY,
                cabinWidth,
                cargoHeight
            );
        }

        /*
         * ---------------------------------------------------------
         * PACKAGES
         * ---------------------------------------------------------
         */

        boxes.forEach((box, index) => {
            let x;
            let y;
            let width;
            let height;

            if (view === "top") {
                x =
                    cargoX +
                    box.x * scale;

                y =
                    offsetY +
                    box.y * scale;

                width =
                    box.w * scale;

                height =
                    box.d * scale;
            } else {
                /*
                 * Side projection:
                 *
                 * X = truck length
                 * Y = truck height
                 */

                x =
                    cargoX +
                    box.x * scale;

                y =
                    offsetY +
                    (
                        containerHeight -
                        box.z -
                        box.h
                    ) * scale;

                width =
                    box.w * scale;

                height =
                    box.h * scale;
            }

            ctx.fillStyle =
                box.color || "#2490ef";

            ctx.globalAlpha = 0.7;

            ctx.fillRect(
                x,
                y,
                width,
                height
            );

            ctx.globalAlpha = 1;

            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 1;

            ctx.strokeRect(
                x,
                y,
                width,
                height
            );

            if (
                width >= 25 &&
                height >= 20
            ) {
                ctx.fillStyle = "#ffffff";
                ctx.font =
                    "bold 12px sans-serif";

                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                ctx.fillText(
                    String(index + 1),
                    x + width / 2,
                    y + height / 2
                );
            }
        });

        /*
         * ---------------------------------------------------------
         * REJECTED PACKAGES
         * ---------------------------------------------------------
         */

        if (rejectedBoxes.length > 0) {
            ctx.fillStyle = "#dc2626";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";

            ctx.fillText(
                `${rejectedBoxes.length} package(s) rejected`,
                15,
                displayHeight - 15
            );
        }
    }, [
        packedBoxes,
        truckDim,
        view
    ]);

    return canvasRef;
}


/*
 * =========================================================
 * TOP VIEW CABIN
 * =========================================================
 */

function drawTopCabin(ctx, x, y, width, height) {
    const cabinHeight = height * 0.72;
    const cabinY = y + (height - cabinHeight) / 2;

    ctx.save();

    ctx.fillStyle = "#cbd5e1";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;

    /*
     * Simple top-view cab outline
     *
     * ┌───────────────┐
     * │      ┌────┐   │
     * │      │    │   │
     * │      └────┘   │
     * └───────────────┘
     */

    ctx.beginPath();

    ctx.moveTo(x + width * 0.08, cabinY);
    ctx.lineTo(x + width * 0.72, cabinY);

    // Front corners
    ctx.quadraticCurveTo(
        x + width * 0.92,
        cabinY,
        x + width * 0.92,
        cabinY + cabinHeight * 0.18
    );

    ctx.lineTo(
        x + width * 0.92,
        cabinY + cabinHeight * 0.82
    );

    ctx.quadraticCurveTo(
        x + width * 0.92,
        cabinY + cabinHeight,
        x + width * 0.72,
        cabinY + cabinHeight
    );

    ctx.lineTo(
        x + width * 0.08,
        cabinY + cabinHeight
    );

    ctx.quadraticCurveTo(
        x,
        cabinY + cabinHeight,
        x,
        cabinY + cabinHeight * 0.82
    );

    ctx.lineTo(
        x,
        cabinY + cabinHeight * 0.18
    );

    ctx.quadraticCurveTo(
        x,
        cabinY,
        x + width * 0.08,
        cabinY
    );

    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    /*
     * Windshield / front window
     */
    ctx.beginPath();

    ctx.moveTo(
        x + width * 0.72,
        cabinY + cabinHeight * 0.12
    );

    ctx.lineTo(
        x + width * 0.86,
        cabinY + cabinHeight * 0.24
    );

    ctx.lineTo(
        x + width * 0.86,
        cabinY + cabinHeight * 0.76
    );

    ctx.lineTo(
        x + width * 0.72,
        cabinY + cabinHeight * 0.88
    );

    ctx.closePath();

    ctx.stroke();

    ctx.restore();
}


function drawSideCabin(ctx, x, y, width, height) {
    const cabinHeight = height * 0.82;
    const cabinY = y + height - cabinHeight;

    ctx.save();

    ctx.fillStyle = "#cbd5e1";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;

    /*
     * Simple side-view cab silhouette
     *
     *             ┌─────────┐
     *            /          │
     *           /           │
     * ─────────┘            │
     *                        │
     * ───────────────────────┘
     */

    ctx.beginPath();

    ctx.moveTo(x, y + height);

    ctx.lineTo(x, cabinY + cabinHeight * 0.32);

    ctx.lineTo(
        x + width * 0.28,
        cabinY
    );

    ctx.lineTo(
        x + width * 0.76,
        cabinY
    );

    ctx.quadraticCurveTo(
        x + width * 0.94,
        cabinY,
        x + width,
        cabinY + cabinHeight * 0.24
    );

    ctx.lineTo(
        x + width,
        y + height
    );

    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    /*
     * Side window
     */
    ctx.beginPath();

    ctx.moveTo(
        x + width * 0.34,
        cabinY + cabinHeight * 0.12
    );

    ctx.lineTo(
        x + width * 0.70,
        cabinY + cabinHeight * 0.12
    );

    ctx.lineTo(
        x + width * 0.84,
        cabinY + cabinHeight * 0.34
    );

    ctx.lineTo(
        x + width * 0.34,
        cabinY + cabinHeight * 0.34
    );

    ctx.closePath();

    ctx.stroke();

    ctx.restore();
}