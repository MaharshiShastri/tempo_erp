import { useCallback, useState } from "react";

const DEFAULT_PRODUCT = {
    width: "",
    height: "",
    depth: "",
    invoiceValue: "",
    dueDate: "",
    color: "#2490ef",
};

const DEFAULT_TRUCK_DIM = {
    length: 240,
    width: 90,
    height: 90,
};

// Simple ID generator that works everywhere
const createId = () =>
    `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

const createProduct = () => ({
    id: createId(),
    ...DEFAULT_PRODUCT,
});

export default function useTruckPlanner() {
    const [plannerProducts, setPlannerProducts] = useState(() => [
        createProduct(),
    ]);

    const [unit, setUnit] = useState("in");

    const [truckDim, setTruckDim] = useState({
        ...DEFAULT_TRUCK_DIM,
    });

    // ============================================================
    // UPDATE PRODUCT
    // ============================================================

    const updateProduct = useCallback((index, field, value) => {
        setPlannerProducts((currentProducts) =>
            currentProducts.map((product, productIndex) => {
                if (productIndex !== index) {
                    return product;
                }

                return {
                    ...product,
                    [field]: value,
                };
            })
        );
    }, []);

    // ============================================================
    // ADD PRODUCT
    // ============================================================

    const addProduct = useCallback(() => {
        setPlannerProducts((currentProducts) => {
            if (currentProducts.length >= 20) {
                return currentProducts;
            }

            return [
                ...currentProducts,
                createProduct(),
            ];
        });
    }, []);

    // ============================================================
    // REMOVE PRODUCT
    // ============================================================

    const removeProduct = useCallback((index) => {
        setPlannerProducts((currentProducts) => {
            if (currentProducts.length <= 1) {
                return currentProducts;
            }

            return currentProducts.filter(
                (_, productIndex) =>
                    productIndex !== index
            );
        });
    }, []);

    // ============================================================
    // RESET PLANNER
    // ============================================================

    const resetPlanner = useCallback(() => {
        setPlannerProducts([
            createProduct(),
        ]);

        setUnit("in");

        setTruckDim({
            ...DEFAULT_TRUCK_DIM,
        });
    }, []);

    // ============================================================
    // UPDATE TRUCK DIMENSION
    // ============================================================

    const updateTruckDimension = useCallback(
        (field, value) => {
            setTruckDim((currentTruck) => ({
                ...currentTruck,
                [field]: value,
            }));
        },
        []
    );

    return {
        // Product state
        plannerProducts,
        updateProduct,
        addProduct,
        removeProduct,
        setPlannerProducts,

        // Truck state
        truckDim,
        setTruckDim,
        updateTruckDimension,

        // Unit
        unit,
        setUnit,

        // Actions
        resetPlanner,
    };
}