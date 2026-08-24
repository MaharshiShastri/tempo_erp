import { useEffect, useRef } from "react";

export default function useTruckCanvas(
    packedBoxes,
    truckDim,
    view = "top"
) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const parent =
            canvas.parentElement;

        if (!parent) {
            return;
        }

        const rect =
            parent.getBoundingClientRect();

        const displayWidth =
            rect.width;

        const displayHeight =
            rect.height;

        if (
            displayWidth <= 0 ||
            displayHeight <= 0
        ) {
            return;
        }

        const dpr =
            window.devicePixelRatio || 1;

        canvas.width =
            Math.floor(
                displayWidth * dpr
            );

        canvas.height =
            Math.floor(
                displayHeight * dpr
            );

        canvas.style.width =
            `${displayWidth}px`;

        canvas.style.height =
            `${displayHeight}px`;

        const ctx =
            canvas.getContext("2d");

        if (!ctx) {
            return;
        }

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        ctx.clearRect(
            0,
            0,
            displayWidth,
            displayHeight
        );

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
            ctx.font =
                "14px sans-serif";
            ctx.textAlign = "center";

            ctx.fillText(
                "Enter valid truck dimensions",
                displayWidth / 2,
                displayHeight / 2
            );

            return;
        }

        const padding = 40;

        let projectionWidth;
        let projectionHeight;

        if (view === "top") {
            projectionWidth =
                containerLength;

            projectionHeight =
                containerWidth;
        } else {
            projectionWidth =
                containerLength;

            projectionHeight =
                containerHeight;
        }

        const scale = Math.min(
            (displayWidth -
                padding * 2) /
                projectionWidth,

            (displayHeight -
                padding * 2) /
                projectionHeight
        );

        const drawWidth =
            projectionWidth * scale;

        const drawHeight =
            projectionHeight * scale;

        const offsetX =
            (displayWidth -
                drawWidth) /
            2;

        const offsetY =
            (displayHeight -
                drawHeight) /
            2;

        /*
         * Background
         */
        ctx.fillStyle = "#e2e8f0";

        ctx.fillRect(
            0,
            0,
            displayWidth,
            displayHeight
        );

        /*
         * Truck
         */
        ctx.fillStyle = "#f8fafc";

        ctx.fillRect(
            offsetX,
            offsetY,
            drawWidth,
            drawHeight
        );

        ctx.strokeStyle =
            "#475569";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            offsetX,
            offsetY,
            drawWidth,
            drawHeight
        );

        /*
         * Label
         */
        const label =
            view === "top"
                ? "TOP VIEW"
                : view === "left"
                ? "LEFT SIDE VIEW"
                : "RIGHT SIDE VIEW";

        ctx.fillStyle =
            "#334155";

        ctx.font =
            "bold 13px sans-serif";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "alphabetic";

        ctx.fillText(
            label,
            displayWidth / 2,
            20
        );

        /*
         * Packages
         */
        boxes.forEach((box, index) => {
            let x;
            let y;
            let width;
            let height;

            if (view === "top") {
                x =
                    offsetX +
                    box.x * scale;

                y =
                    offsetY +
                    box.y * scale;

                width =
                    box.w * scale;

                height =
                    box.d * scale;
            } else {
                const projectedX =
                    view === "left"
                        ? box.x
                        : containerLength -
                          box.x -
                          box.w;

                x =
                    offsetX +
                    projectedX * scale;

                y =
                    offsetY +
                    (
                        containerHeight -
                        box.z -
                        box.h
                    ) *
                        scale;

                width =
                    box.w * scale;

                height =
                    box.h * scale;
            }

            ctx.fillStyle =
                box.color ||
                "#2490ef";

            ctx.globalAlpha =
                0.7;

            ctx.fillRect(
                x,
                y,
                width,
                height
            );

            ctx.globalAlpha = 1;

            ctx.strokeStyle =
                "#1e293b";

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
                ctx.fillStyle =
                    "#ffffff";

                ctx.font =
                    "bold 12px sans-serif";

                ctx.textAlign =
                    "center";

                ctx.textBaseline =
                    "middle";

                ctx.fillText(
                    String(index + 1),
                    x +
                        width / 2,
                    y +
                        height / 2
                );
            }
        });

        /*
         * Rejected packages
         */
        if (
            rejectedBoxes.length > 0
        ) {
            ctx.fillStyle =
                "#dc2626";

            ctx.font =
                "bold 12px sans-serif";

            ctx.textAlign =
                "left";

            ctx.textBaseline =
                "alphabetic";

            ctx.fillText(
                `${rejectedBoxes.length} package(s) rejected`,
                15,
                displayHeight - 15
            );
        }
    }, [packedBoxes, truckDim, view]);

    return canvasRef;
}