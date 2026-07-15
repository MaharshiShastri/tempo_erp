import { useState, useCallback } from "react";
import API from "../api/api";

export default function useDispatchPlanner({sessionToken, showErrorModal}) {

    const [products, setProducts] = useState([{width: "", height: "", depth: ""}]);

    const [unit, setUnit] = useState("cm");

    const [dispatchForm, setDispatchForm] = useState({
        invoice_value: 0,
        destination_city: "",
        diesel_price: 98,
        loading_type: "local",
        hub_loading_input: 0,
        delivery_type: "door",
        hamali_detail: "",
        hamali_cost: 0
    });

    const [dispatchEvaluation, setDispatchEvaluation] = useState(null);

    const [selectedTransport, setSelectedTransport] = useState(null);

    const evaluateDispatch = useCallback(async payload => {
        try {
            const result = await API.evaluateDispatch(payload, sessionToken);
            setDispatchEvaluation(result);
            return result;
        }
        catch (err) {
            showErrorModal?.("Dispatch Evaluation", err.message);
            throw err;
        }
    }, [sessionToken, showErrorModal]);

    return {products, setProducts, unit, setUnit, dispatchForm, setDispatchForm, dispatchEvaluation, selectedTransport, setSelectedTransport, evaluateDispatch};

}