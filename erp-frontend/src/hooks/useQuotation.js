import API from "../api/api";
import { useMemo, useState } from "react";


export default function useQuotation({sessionToken, showErrorModal}){

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
    const [quoteSpecialItinerary, setQuoteSpecialItinerary] = useState("");

    const handleGenerateQuote = async(e) => {
        e.preventDefault();
        if(quoteSelectedGroup.length !== 1){
            showErrorModal("Quote Generation", "Please select only one product group.");
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
                    special_itinerary: quoteSpecialItinerary || null,
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
    
    return {quoteSelectedGroup, setQuoteSelectedGroup, clientQuoteCompany, setClientQuoteCompany, qouteAddress, setQouteAddress,
    qouteCity, setQouteCity, clientQuoteEmail, setClientQuoteEmail, buyerQuoteName, setBuyerQuoteName, qouteDateInput, setQouteDateInput,
    qouteGenerating, setQouteGenerating, handleGenerateQuote, buyerQouteNum, setBuyerQouteNum, qouteNum, setQouteNum,
    qoutePostalCode, setQoutePostalCode, quoteSupply, setQuoteSupply, quoteInstallation, setQuoteInstallation, quoteFreight,
    setQuoteFreight, quoteDealer, setQuoteDealer, quoteSpecialModel, setQuoteSpecialModel, quoteSpecialItinerary, setQuoteSpecialItinerary,
    }
}