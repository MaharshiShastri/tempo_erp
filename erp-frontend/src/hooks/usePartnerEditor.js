import { useState, useEffect } from "react";
import API from "../api/api";

export default function usePartnerEditor({state, setModalAlert, zones, setZones, fuelMatrix, setFuelMatrix, odaDistances, setOdaDistances, odaWeights, setOdaWeights, odaCharges, setOdaCharges}){
    const defaultPartner = {name: "", partner_link: "", cft_factor: 10, minimum_weight: 0, minimum_freight_value: 0, documentation_charge: 0,
    fov_percentage: 0, gst_percentage: 18, local_loading_cost: 0, hub_loading_max_cost: 0};

    const [availablePartners, setAvailablePartners] = useState([]);
    const [selectedPartnerId, setSelectedPartnerId] = useState("");
    const [partner, setPartner] = useState(defaultPartner);
    const [originalPayloadString, setOriginalPayloadString] = useState("{}");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => { loadPartnersList(); }, []);

    const loadPartnersList = async () => {
        try {
            const data = await API.getPartners(state.user.access_token);
            setAvailablePartners(data || []);
        } catch (err) {
            setModalAlert({ isOpen: true, title: "Fetch Error", message: "Failed to load partners list.", isError: true });
        }
    };

    const handlePartnerSelection = async (e) => {
        const id = e.target.value;
        setSelectedPartnerId(id);
        if (!id) { populateState(defaultPartner); return; }

        try {
            const profile = await API.getPartnerProfile(id, state.user.access_token);
            populateState(profile);
        } catch (err) {
            setModalAlert({ isOpen: true, title: "Fetch Error", message: "Failed to load partner profile.", isError: true });
        }
    };

    const handleDelete = async () => {
        if (!selectedPartnerId) return;
        
        const confirmDelete = window.confirm("⚠️ Are you sure you want to completely delete this logistics partner?\n\nThis will permanently wipe all their core parameters, zones, rates, fuel matrices, and ODA matrices. This action cannot be undone.");
            
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/v1/logistics/config/partners/${selectedPartnerId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${state.user.access_token}` }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Deletion failed on the server.");
            }

            const result = await response.json();
                
            setModalAlert({ isOpen: true, title: "Partner Deleted", message: `🗑️ ${result.partner_name || "Logistics Partner"} was successfully removed from the system.`, isError: false });
                
            setSelectedPartnerId("");
            populateState(defaultPartner);
            loadPartnersList(); 
                
        } catch (err) {
            setModalAlert({ isOpen: true, title: "Deletion Failed", message: err.message, isError: true });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = buildCurrentPayload();
        try {
            let backendResponse;
            if (selectedPartnerId) { backendResponse = await API.updateDispatchPartner(selectedPartnerId, payload, state.user.access_token); } 
            else { backendResponse = await API.saveDispatchPartner(payload, state.user.access_token); setSelectedPartnerId(""); }
                
            const actionStatus = backendResponse.status || "processed";
            const partnerName = backendResponse.partner_name || payload.name;
            setModalAlert({ isOpen: true, title: "Database Synced", message: `🚚 Logistics Partner "${partnerName}" was successfully ${actionStatus}.`, isError: false });
            setOriginalPayloadString(JSON.stringify(payload));
            loadPartnersList(); 
        } catch (err) {
            setModalAlert({ isOpen: true, title: "Sync Failure", message: err.message, isError: true });
        }
    };


    const populateState = (profile) => {
        setPartner({
            name: profile.name || "", partner_link: profile.partner_link || "", cft_factor: profile.cft_factor ?? 10,
            minimum_weight: profile.minimum_weight ?? 0, minimum_freight_value: profile.minimum_freight_value ?? 0,
            documentation_charge: profile.documentation_charge ?? 0, fov_percentage: profile.fov_percentage ?? 0,
            gst_percentage: profile.gst_percentage ?? 18, local_loading_cost: profile.local_loading_cost ?? 0, hub_loading_max_cost: profile.hub_loading_max_cost ?? 0
        });

        // Smart merge: Map the backend's separate rates back onto their matching zones for the UI
        const loadedZones = profile.zones || [];
        const loadedRates = profile.rates || [];
            
        const unifiedZones = loadedZones.map(z => {
            const matchingRate = loadedRates.find(r => r.destination_zone === z.zone_code);
            return {...z, states_raw: z.states_raw || (z.states ? z.states.join(', ') : ""), rate_per_kg: matchingRate ? matchingRate.rate_per_kg : ""};
        });

        setZones(unifiedZones);
        setFuelMatrix(profile.fuel_matrix || []);

        const loadedOda = profile.oda_matrix || [];
        const dMap = new Map(); const wMap = new Map(); const newCharges = {};

        loadedOda.forEach((o, idx) => {
            const dKey = `${o.km_from}-${o.km_to}`; const wKey = `${o.weight_from}-${o.weight_to}`;
            if (!dMap.has(dKey)) dMap.set(dKey, { id: `d_${idx}`, from: o.km_from, to: o.km_to });
            if (!wMap.has(wKey)) wMap.set(wKey, { id: `w_${idx}`, from: o.weight_from, to: o.weight_to });
            newCharges[`${dMap.get(dKey).id}_${wMap.get(wKey).id}`] = o.oda_charge;
        });

        setOdaDistances(Array.from(dMap.values())); setOdaWeights(Array.from(wMap.values())); setOdaCharges(newCharges);

        setTimeout(() => setOriginalPayloadString(JSON.stringify(buildCurrentPayload())), 100);
    };

    
    const buildCurrentPayload = () => {
        const compiledOdaMatrix = [];
        odaDistances.forEach(dist => {
            odaWeights.forEach(wt => {
                const chargeVal = odaCharges[`${dist.id}_${wt.id}`];
                if (chargeVal !== undefined && chargeVal !== "" && chargeVal !== null) {
                    compiledOdaMatrix.push({
                        km_from: parseFloat(dist.from) || 0, km_to: parseFloat(dist.to) || 0,
                        weight_from: parseFloat(wt.from) || 0, weight_to: parseFloat(wt.to) || 0,
                        oda_charge: parseFloat(chargeVal) || 0
                    });
                }
            });
        });

        return {
            name: partner.name || "", partner_link: partner.partner_link || "", cft_factor: parseFloat(partner.cft_factor) || 0,
            minimum_weight: parseFloat(partner.minimum_weight) || 0, minimum_freight_value: parseFloat(partner.minimum_freight_value) || 0,
            documentation_charge: parseFloat(partner.documentation_charge) || 0, fov_percentage: parseFloat(partner.fov_percentage) || 0,
            gst_percentage: parseFloat(partner.gst_percentage) || 0, local_loading_cost: parseFloat(partner.local_loading_cost) || 0, 
            hub_loading_max_cost: parseFloat(partner.hub_loading_max_cost) || 0,
            
            // Build the Zones list for the backend
            zones: zones.filter(z => z.zone_code).map(z => ({ 
                zone_code: z.zone_code.trim(), 
                zone_name: (z.zone_name || "").trim(), 
                states: (z.states_raw || "").split(",").map(s => s.trim()).filter(Boolean) 
            })),
            
            // Automatically derive the Rates list from the unified UI table for the backend
            rates: zones.filter(z => z.zone_code && z.rate_per_kg !== "").map(z => ({ 
                destination_zone: z.zone_code.trim(), 
                rate_per_kg: parseFloat(z.rate_per_kg) || 0 
            })),
            
            fuel_matrix: fuelMatrix.filter(f => f.fuel_price_from !== "" && f.fuel_price_to !== "").map(f => ({ fuel_price_from: parseFloat(f.fuel_price_from) || 0, fuel_price_to: parseFloat(f.fuel_price_to) || 0, surcharge_percentage: parseFloat(f.surcharge_percentage) || 0 })),
            oda_matrix: compiledOdaMatrix
        };
    };

    return {partner, setPartner, availablePartners, selectedPartnerId, setSelectedPartnerId, handlePartnerSelection, handleDelete, handleSave, buildCurrentPayload, populateState, isDeleting, originalPayloadString};
    
}