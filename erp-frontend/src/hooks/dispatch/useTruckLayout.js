import { useMemo } from "react";

function toInches(value, unit) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return 0;
    }

    if (unit === "cm") {
        return numericValue / 2.54;
    }

    return numericValue;
}

function getPriorityDate(product) {
    if (!product.dueDate) {
        return Number.MAX_SAFE_INTEGER;
    }

    const timestamp = new Date(
        product.dueDate
    ).getTime();

    if (!Number.isFinite(timestamp)) {
        return Number.MAX_SAFE_INTEGER;
    }

    return timestamp;
}

function getInvoiceValue(product) {
    const value = Number(
        product.invoiceValue
    );

    return Number.isFinite(value)
        ? value
        : 0;
}

function canFit({
    width,
    depth,
    height,
    x,
    y,
    z,
    truckLength,
    truckWidth,
    truckHeight,
}) {
    return (
        width <= truckLength &&
        depth <= truckWidth &&
        height <= truckHeight &&
        x + width <= truckLength &&
        y + depth <= truckWidth &&
        z + height <= truckHeight
    );
}

export default function useTruckLayout(
    products,
    unit,
    truckDim
) {
    const packedBoxes = useMemo(() => {
        const truckLength =
            Number(truckDim?.length) || 0;

        const truckWidth =
            Number(truckDim?.width) || 0;

        const truckHeight =
            Number(truckDim?.height) || 0;

        const result = {
            boxes: [],
            rejectedBoxes: [],
            containerLength: truckLength,
            containerWidth: truckWidth,
            containerHeight: truckHeight,
        };

        if (
            truckLength <= 0 ||
            truckWidth <= 0 ||
            truckHeight <= 0
        ) {
            return result;
        }

        const candidates = products
            .map((product, index) => {
                const width = toInches(
                    product.width,
                    unit
                );

                const depth = toInches(
                    product.depth,
                    unit
                );

                const height = toInches(
                    product.height,
                    unit
                );

                return {
                    ...product,

                    originalIndex: index,

                    width,
                    depth,
                    height,

                    invoiceValue:
                        getInvoiceValue(product),

                    priorityDate:
                        getPriorityDate(product),

                    color:
                        product.color ||
                        "#2490ef",
                };
            })
            .filter(
                (product) =>
                    product.width > 0 &&
                    product.depth > 0 &&
                    product.height > 0
            );

        /*
         * Priority:
         *
         * 1. Earliest due date
         * 2. Highest invoice value
         * 3. Original table order
         */
        candidates.sort((a, b) => {
            if (
                a.priorityDate !==
                b.priorityDate
            ) {
                return (
                    a.priorityDate -
                    b.priorityDate
                );
            }

            if (
                a.invoiceValue !==
                b.invoiceValue
            ) {
                return (
                    b.invoiceValue -
                    a.invoiceValue
                );
            }

            return (
                a.originalIndex -
                b.originalIndex
            );
        });

        const boxes = [];
        const rejectedBoxes = [];

        let currentX = 0;
        let currentY = 0;
        let currentZ = 0;

        let rowDepth = 0;
        let levelHeight = 0;

        for (const product of candidates) {
            const orientations = [
                {
                    width: product.width,
                    depth: product.depth,
                },
                {
                    width: product.depth,
                    depth: product.width,
                },
            ];

            let selected = null;

            /*
             * -------------------------------------------------
             * Attempt 1:
             * Current row / current level
             * -------------------------------------------------
             */
            for (const orientation of orientations) {
                if (
                    canFit({
                        ...orientation,

                        height:
                            product.height,

                        x: currentX,
                        y: currentY,
                        z: currentZ,

                        truckLength,
                        truckWidth,
                        truckHeight,
                    })
                ) {
                    selected = orientation;
                    break;
                }
            }

            /*
             * -------------------------------------------------
             * Attempt 2:
             * New row
             * -------------------------------------------------
             */
            if (!selected) {
                currentX = 0;
                currentY += rowDepth;
                rowDepth = 0;

                for (const orientation of orientations) {
                    if (
                        canFit({
                            ...orientation,

                            height:
                                product.height,

                            x: currentX,
                            y: currentY,
                            z: currentZ,

                            truckLength,
                            truckWidth,
                            truckHeight,
                        })
                    ) {
                        selected = orientation;
                        break;
                    }
                }
            }

            /*
             * -------------------------------------------------
             * Attempt 3:
             * New vertical level
             * -------------------------------------------------
             */
            if (!selected) {
                currentX = 0;
                currentY = 0;
                currentZ += levelHeight;

                rowDepth = 0;
                levelHeight = 0;

                for (const orientation of orientations) {
                    if (
                        canFit({
                            ...orientation,

                            height:
                                product.height,

                            x: currentX,
                            y: currentY,
                            z: currentZ,

                            truckLength,
                            truckWidth,
                            truckHeight,
                        })
                    ) {
                        selected = orientation;
                        break;
                    }
                }
            }

            /*
             * -------------------------------------------------
             * Package does not fit
             * -------------------------------------------------
             */
            if (!selected) {
                rejectedBoxes.push({
                    ...product,
                    fits: false,
                    reason:
                        "Package cannot fit inside truck dimensions.",
                });

                continue;
            }

            const box = {
                id: product.id,

                productIndex:
                    product.originalIndex,

                x: currentX,
                y: currentY,
                z: currentZ,

                w: selected.width,
                h: product.height,
                d: selected.depth,

                fits: true,

                invoiceValue:
                    product.invoiceValue,

                dueDate:
                    product.dueDate,

                color:
                    product.color,

                originalProduct:
                    product,
            };

            boxes.push(box);

            currentX += selected.width;

            rowDepth = Math.max(
                rowDepth,
                selected.depth
            );

            levelHeight = Math.max(
                levelHeight,
                product.height
            );
        }

        return {
            boxes,
            rejectedBoxes,
            containerLength: truckLength,
            containerWidth: truckWidth,
            containerHeight: truckHeight,
        };
    }, [
        products,
        unit,
        truckDim.length,
        truckDim.width,
        truckDim.height,
    ]);

    return {
        packedBoxes,
    };
}