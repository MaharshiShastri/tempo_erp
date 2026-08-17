import API from "../api/api";
import { useMemo, useState } from "react";


export default function useQuotation({sessionToken, showErrorModal}){
    const [quotations, setQuotations] = useState([]);
    const [quotationsLoading, setQuotationsLoading] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [quotationModalOpen, setQuotationModalOpen] = useState(false);
    const [quotationDeleteOpen, setQuotationDeleteOpen] = useState(false);
    const [quotationSearch, setQuotationSearch] = useState("");

    const [quotationEditMode, setQuotationEditMode] = useState(false);
    const [quotationEditForm, setQuotationEditForm] = useState({});
    const [quotationSaving, setQuotationSaving] = useState(false);

    const [quoteSelectedGroup, setQuoteSelectedGroup] = useState([]);

    const [clientQuoteCompany, setClientQuoteCompany] = useState("");
    const [qouteAddress, setQouteAddress] = useState("");
    const [qouteCity, setQouteCity] = useState("");
    const [qoutePostalCode, setQoutePostalCode] = useState("")
    const [clientQuoteEmail, setClientQuoteEmail] = useState("");
    const [buyerQuoteName, setBuyerQuoteName] = useState("");
    const [buyerQouteNum, setBuyerQouteNum] = useState("");
    const [qouteDateInput, setQouteDateInput] = useState(new Date().toISOString().split("T")[0]);
    const [qouteNum, setQouteNum] = useState("")
    const [qouteGenerating, setQouteGenerating] = useState(false);

    const [quoteSupply, setQuoteSupply] = useState("7-8 weeks, time specified effecting delivery date of receipt of your clear PO with terms & conditions with Advance payment. No delivery indicated by us shall be constructed as promised. We cannot accept any liability for damage direct and indirect on account of failure to deliver in the stated time.");
    const [quoteInstallation, setQuoteInstallation] = useState("Extra Rs. 15000/- Per Single Visit + GST @ 18% Extra");
    const [quoteFreight, setQuoteFreight] = useState("Extra at Actual. (Material will be book on Freight to pay basis upto nearest transporter’s godown through our Transporter M/s. OM LOGISTIC TRANSPORT).");

    const [quoteDealer, setQuoteDealer] = useState(false);

    const [quoteSpecialModel, setQuoteSpecialModel] = useState(false);
    
    const [quoteSelectedItemCode, setQuoteSelectedItemCode] = useState([]);
    const [quoteSpecialRows, setQuoteSpecialRows] = useState([["", ""], ]);
    const [quoteSpecialColumns, setQuoteSpecialColumns] = useState(["Parameter", "Value"]);
    const [quotationChangeOpen, setQuotationChangeOpen] = useState(false);

    const [quotationChangeForm, setQuotationChangeForm] = useState({
        quoted_product_name: "",
        quoted_item_code: "",
        quoted_quantity: "",
        quoted_rate: "",

        ordered_product_name: "",
        ordered_item_code: "",
        ordered_quantity: "",
        ordered_rate: "",

        order_id: "",
    });

    const openQuotationChange = (quotation) => {
        setSelectedQuotation(quotation);

        setQuotationChangeForm({
            quoted_product_name: quotation.product_name || "",

            quoted_item_code: quotation.item_code || "",

            quoted_quantity:"",

            quoted_rate: "",

            ordered_product_name: "",
            ordered_item_code: "",
            ordered_quantity: "",
            ordered_rate: "",
            order_id: "",
        });

        setQuotationChangeOpen(true);
    };

    const closeQuotationChange = () => {
        setQuotationChangeOpen(false);

        setQuotationChangeForm({
            quoted_product_name: "",
            quoted_item_code: "",
            quoted_quantity: "",
            quoted_rate: "",

            ordered_product_name: "",
            ordered_item_code: "",
            ordered_quantity: "",
            ordered_rate: "",
            order_id: "",
        });
    };

    const updateQuotationChangeField = (field, value) => {
        setQuotationChangeForm(prev => ({
            ...prev,
            [field]: value,
        }));
    };
    const submitQuotationChange = async () => {

        if (!selectedQuotation?.id) {
            showErrorModal(
                "Quotation",
                "Quotation ID is missing."
            );
            return;
        }

        if (!quotationChangeForm.ordered_product_name.trim()) {
            showErrorModal(
                "Changed Quotation",
                "Ordered product is required."
            );
            return;
        }

        try {

            await updateQuotationStatus(
                selectedQuotation,
                "CHANGED",
                {
                    quoted_product_name:
                        quotationChangeForm.quoted_product_name,

                    quoted_item_code:
                        quotationChangeForm.quoted_item_code || null,

                    quoted_quantity:
                        quotationChangeForm.quoted_quantity
                            ? Number(
                                quotationChangeForm.quoted_quantity
                            )
                            : null,

                    quoted_rate:
                        quotationChangeForm.quoted_rate
                            ? Number(
                                quotationChangeForm.quoted_rate
                            )
                            : null,

                    ordered_product_name:
                        quotationChangeForm.ordered_product_name,

                    ordered_item_code:
                        quotationChangeForm.ordered_item_code || null,

                    ordered_quantity:
                        quotationChangeForm.ordered_quantity
                            ? Number(
                                quotationChangeForm.ordered_quantity
                            )
                            : null,

                    ordered_rate:
                        quotationChangeForm.ordered_rate
                            ? Number(
                                quotationChangeForm.ordered_rate
                            )
                            : null,
                },
                quotationChangeForm.order_id
                    ? Number(quotationChangeForm.order_id)
                    : null
            );

            closeQuotationChange();

        } catch (error) {
            showErrorModal(
                "Changed Quotation",
                error.message
            );
        }
    };


    const loadQuotations = async () => {
        try {
            setQuotationsLoading(true);

            const data = await API.getQuotations(sessionToken);

            setQuotations(Array.isArray(data) ? data : []);

        } catch (err) {
            showErrorModal("Quotation List", err.message);
        } finally {
            setQuotationsLoading(false);
        }
    };

    const openQuotation = async (quotation) => {
        try {
            const data = await API.getQuotation(
                sessionToken,
                quotation.id
            );

            setSelectedQuotation(data);
            setQuotationEditMode(false);
            setQuotationEditForm({});
            setQuotationModalOpen(true);

        } catch (err) {
            showErrorModal("Quotation", err.message);
        }
    };


    const editQuotation = async (quotation) => {
        try {
            const data = await API.getQuotation(
                sessionToken,
                quotation.id
            );

            setSelectedQuotation(data);

            setQuotationEditForm({
                product_name: data.product_name || "",
                client_company: data.client_company || "",
                client_address_line1: data.client_address_line1 || "",
                client_city: data.client_city || "",
                client_postal_code: data.client_postal_code || "",
                client_email: data.client_email || "",
                buyer_name: data.buyer_name || "",
                buyer_phone_number: data.buyer_phone_number || "",
                enquiry_date: data.enquiry_date || "",
                supply: data.supply || "",
                installation: data.installation || "",
                freight: data.freight || "",
                is_dealer: Boolean(data.is_dealer),
                is_special_model: Boolean(data.is_special_model),
            });

            setQuotationEditMode(true);
            setQuotationModalOpen(true);

        } catch (err) {
            showErrorModal("Quotation", err.message);
        }
    };

    const closeQuotationModal = () => {
        setQuotationModalOpen(false);
        setSelectedQuotation(null);
        setQuotationEditMode(false);
        setQuotationEditForm({});   
    };

    const confirmDeleteQuotation = (quotation) => {
        setSelectedQuotation(quotation);
        setQuotationDeleteOpen(true);
    };

    const deactivateQuotation = async () => {
        if (!selectedQuotation) {
            return;
        }

        try {
            await API.deleteQuotation(sessionToken, selectedQuotation.id);

            setQuotations(prev =>prev.filter(q => q.id !== selectedQuotation.id));

            setQuotationDeleteOpen(false);
            setSelectedQuotation(null);

        } catch (err) {
            showErrorModal("Quotation", err.message);
        }
    };


    const addSpecialRow = () =>{
        setQuoteSpecialRows(prev=>[...prev, prev[0].map(()=> "")]);
    };

    const addSpecialColumn = () => {
        setQuoteSpecialColumns(prev=>[...prev, `Column ${prev.length + 1}`,]);

        setQuoteSpecialRows(prev=>prev.map(row=>[...row, ""]));
    };

    const updateSpecialCell = (rowIndex, columnIndex, value) => {
        setQuoteSpecialRows(prev=>prev.map((row, rIndex)=>{
            if(rIndex !== rowIndex){ return row;}

            return row.map((cell, cIndex) => cIndex === columnIndex ? value : cell);
        }));
    }; 

    const updateSpecialColumn = (columnIndex, value) => {
        setQuoteSpecialColumns(prev =>
            prev.map((column, index) =>
                index === columnIndex
                    ? value
                    : column
            )
        );
    };

    const updateQuotationField = (field, value) => {
        setQuotationEditForm(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const saveQuotationChanges = async () => {
        if (!selectedQuotation?.id) {
            showErrorModal(
                "Quotation",
                "Quotation ID is missing."
            );
            return;
        }

        try {
            setQuotationSaving(true);

            const updated = await API.updateQuotation(
                sessionToken,
                selectedQuotation.id,
                quotationEditForm
            );

            setSelectedQuotation(updated);

            setQuotations(prev => prev.map(q =>q.id === updated.id ? updated : q));

            setQuotationEditMode(false);
            setQuotationEditForm({});

        } catch (err) {
            showErrorModal(
                "Quotation Update",
                err.message
            );
        } finally {
            setQuotationSaving(false);
        }
    };

    const removeSpecialRow = (index) => {
        setQuoteSpecialRows(prev =>
            prev.filter((_, rowIndex) => rowIndex !== index)
        );
    };

    const downloadQuotation = async (quotation) => {
        if (!quotation?.id) {
            showErrorModal("Quotation Download", "Quotation ID is missing.");
            return;
        }

        try {
            const blob = await API.downloadQuotation(sessionToken, quotation.id);

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;

            const quoteNumber =quotation.quote_number || quotation.qoute_num || quotation.quotation_number || quotation.id;

            link.download = `Tempo_Quote_${quoteNumber}.docx`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

            await loadQuotations();

            
            setQuoteSelectedGroup([]);

            setClientQuoteCompany("");
            setQouteAddress("");
            setQouteCity("");
            setQoutePostalCode("");
            setClientQuoteEmail("");
            setBuyerQuoteName("");
            setBuyerQouteNum("");
            setQouteDateInput(new Date().toISOString().split("T")[0]);
            setQouteNum("");
            setQuoteSupply("7-8 weeks, time specified effecting delivery date of receipt of your clear PO with terms & conditions with Advance payment. No delivery indicated by us shall be constructed as promised. We cannot accept any liability for damage direct and indirect on account of failure to deliver in the stated time.");
            setQuoteInstallation("Extra Rs. 15000/- Per Single Visit + GST @ 18% Extra");
            setQuoteFreight("Extra at Actual. (Material will be book on Freight to pay basis upto nearest transporter’s godown through our Transporter M/s. OM LOGISTIC TRANSPORT).");

            setQuoteDealer(false);

            setQuoteSpecialModel(false);
        
            setQuoteSelectedItemCode([]);
            setQuoteSpecialRows([["", ""], ]);
            setQuoteSpecialColumns(["Parameter", "Value"]);
        } catch (err) {
            showErrorModal("Quotation Download", err.message);
        }
    };

    const handleGenerateQuote = async(e) => {
        e.preventDefault();
        if(quoteSelectedGroup.length !== 1){
            showErrorModal("Quote Generation", "Please select only one product group.");
            return;
        }

        if (quoteSpecialModel && quoteSelectedItemCode.length !== 1) {
            showErrorModal("Quote Generation", "Please select an item code for the special model.");
            return;
        }

        try{
            setQouteGenerating(true);

            const blob = await API.generateQuote(sessionToken, 
                {
                    product_name: quoteSelectedGroup[0],
                    qoute_number: qouteNum,
                    client_company: clientQuoteCompany, 
                    client_address_line1: qouteAddress,
                    client_city: qouteCity,
                    client_postal_code: qoutePostalCode,
                    client_email: clientQuoteEmail,
                    buyer_name: buyerQuoteName,
                    buyer_phone_number: buyerQouteNum,

                    date_input: qouteDateInput,

                    supply: quoteSupply,
                    installation: quoteInstallation,
                    freight: quoteFreight,
                    
                    dealer: quoteDealer,

                    special_model: quoteSpecialModel,
                    special_columns: quoteSpecialColumns, 
                    special_rows: quoteSpecialRows.map(row=>({values: row})),
                    item_code: quoteSelectedItemCode?.[0] || null,
            });
            
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `Tempo_Quote_${qouteNum}_${clientQuoteCompany}.docx`;

        document.body.appendChild(link);

        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

        } catch(err){
            showErrorModal("Quote Generation", err.message);
        } finally{
            setQouteGenerating(false);
        }
    }

    const handleSpecialModelChange = (checked) => {
        setQuoteSpecialModel(checked);

        if (!checked) {
            setQuoteSpecialRows([
                ["", ""],
            ]);

            setQuoteSpecialColumns([
                "Parameter",
                "Value",
            ]);

            setQuoteSelectedItemCode([]);
        }
    };
    
    const updateQuotationStatus = async (quotation, status, snapshot = null, convertedOrderId = null) => {

        if (!quotation?.id) {
            showErrorModal("Quotation", "Quotation ID is missing.");
            return;
        }

        try {

            const updated =
                await API.updateQuotationStatus(sessionToken, quotation.id,
                    {status, converted_order_id:convertedOrderId, snapshot,}
                );

            setSelectedQuotation(updated);

            setQuotations(prev =>prev.map(q =>q.id === updated.id ? updated : q));

        } catch (err) {

            showErrorModal("Quotation Status", err.message);
        }
    };
    return {quoteSelectedGroup, setQuoteSelectedGroup, clientQuoteCompany, setClientQuoteCompany, qouteAddress, setQouteAddress,
    qouteCity, setQouteCity, clientQuoteEmail, setClientQuoteEmail, buyerQuoteName, setBuyerQuoteName, qouteDateInput, setQouteDateInput,
    qouteGenerating, setQouteGenerating, handleGenerateQuote, buyerQouteNum, setBuyerQouteNum, qouteNum, setQouteNum,
    qoutePostalCode, setQoutePostalCode, quoteSupply, setQuoteSupply, quoteInstallation, setQuoteInstallation, quoteFreight,
    setQuoteFreight, quoteDealer, setQuoteDealer, quoteSpecialModel, setQuoteSpecialModel, quoteSpecialModel, setQuoteSpecialModel,
    quoteSelectedItemCode, setQuoteSelectedItemCode, quoteSpecialColumns, setQuoteSpecialColumns, quoteSpecialRows, setQuoteSpecialRows,
    addSpecialRow, addSpecialColumn, updateSpecialCell, removeSpecialRow, handleSpecialModelChange, updateSpecialColumn, removeSpecialRow,
    quotations, setQuotations, quotationsLoading, selectedQuotation, setSelectedQuotation, quotationModalOpen, setQuotationModalOpen, quotationDeleteOpen,
    setQuotationDeleteOpen, quotationSearch, setQuotationSearch, loadQuotations, openQuotation, closeQuotationModal, confirmDeleteQuotation, 
    deactivateQuotation, editQuotation, quotationEditMode, setQuotationEditMode, quotationEditForm, setQuotationEditForm, quotationSaving, updateQuotationField,
    saveQuotationChanges, downloadQuotation, updateQuotationStatus, openQuotationChange,  closeQuotationChange, quotationChangeOpen, quotationChangeForm,
    updateQuotationChangeField, submitQuotationChange,
    }
}