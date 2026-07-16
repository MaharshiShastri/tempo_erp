import { useState, useCallback, useEffect } from "react";
import API from "../api/api";

export default function useTransportPartners({sessionToken, showErrorModal, addToast}) {

    const defaultPartner = {name: "", partner_link: "", cft_factor: 10, minimum_weight: 0, minimum_freight_value: 0, documentation_charge: 0,
        fov_percentage: 0, gst_percentage: 18, local_loading_cost: 0, hub_loading_max_cost: 0};

    const [partners, setPartners] = useState([]);

    const [selectedPartner, setSelectedPartner] = useState(null);

    const [partnerForm, setPartnerForm] = useState(defaultPartner);

    const [loadingPartners, setLoadingPartners] = useState(false);
    
    const loadPartners = useCallback(async () => {
        if (!sessionToken) return;
        setLoadingPartners(true);
        try {
            const data = await API.getPartners(sessionToken);
            setPartners(Array.isArray(data) ? data : []);
        }
        catch (err) {
            showErrorModal?.("Transport Partners", err.message);
        }
        finally {
            setLoadingPartners(false);
        }
    }, [sessionToken, showErrorModal]);

    useEffect(() => {
        if(sessionToken) {loadPartners();}
    }, [sessionToken]);

    const createPartner = useCallback(async payload => {

        await API.saveDispatchPartner(payload, sessionToken);
        await loadPartners();
        addToast?.("Partner added.", "success");

    }, [sessionToken, loadPartners, addToast]);

    const updatePartner = useCallback(async (id, payload) => {

        await API.updateDispatchPartner(id, payload, sessionToken);
        await loadPartners();

    }, [sessionToken, loadPartners]);

    const patchPartner = useCallback(async (id, payload) => {

        await API.patchDispatchPartner(id, payload, sessionToken);
        await loadPartners();

    }, [sessionToken, loadPartners]);

    const openPartner = useCallback(async id => {

        const profile = await API.getPartnerProfile(id, sessionToken);
        setSelectedPartner(profile);

    }, [sessionToken]);

    return {partners, loadingPartners, partnerForm, setPartnerForm, selectedPartner, loadPartners, createPartner, updatePartner, patchPartner, openPartner};

}