import API from "../../api/api";
import { useState, useEffect } from "react";

export default function useCompanyMaster({sessionToken, setAlertMessage, setIsAlertOpen, setActiveTab}){
    const defaultCompanyForm = { name: '', address_line_1: '', city: '', state: '', pincode: '', contact_name: '', contact_role: '', contact_phone: '' };    
    
    const [companiesMaster, setCompaniesMaster] = useState([]);
    const [companyForm, setCompanyForm] = useState({ ...defaultCompanyForm });
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const industrialCities = ["Mumbai", "Navi Mumbai", "Thane", "Kalyan", "Pune", "Nashik", "Aurangabad", "Nagpur", "Bangalore", "Chennai", "Hyderabad", "Ahmedabad", "New Delhi"];
    const indianStates = ["Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "Gujarat", "Delhi", "Uttar Pradesh", "West Bengal", "Madhya Pradesh", "Rajasthan"];
    const professionalRoles = ["QA/QC", "Production", "Project manager", "Others"];

    const triggerNewCompany = () => {
        setCompanyForm({ ...defaultCompanyForm });
        setIsEditingCompany(false);
        setSelectedCompanyId(null);
        setActiveTab('company-new');
    };

    const triggerEditCompany = async (companyId) => {
        try {
            const companyData = await API.fetchCompany(companyId, sessionToken);
            setCompanyForm({
                name: companyData.name || '',
                address_line_1: companyData.address_line_1 || '',
                city: companyData.city || '',
                state: companyData.state || '',
                pincode: companyData.pincode || '',
                contact_name: companyData.contact_name || '',
                contact_role: companyData.contact_role || '',
                contact_phone: companyData.contact_phone || ''
            });
            setIsEditingCompany(true);
            setSelectedCompanyId(companyId);
            setActiveTab('company-new');
        } catch (err) {
            setAlertMessage("Failed to load company details: " + err.message);
            setIsAlertOpen(true);
        }
    };

    const deleteCompany = async (companyId) => {
        const confirm = window.confirm("Are you sure you want to permanently delete this corporate account?");
        if (!confirm) return;
        
        try {
            await API.deleteCompany(companyId, sessionToken);
            setAlertMessage("Company profile deleted successfully.");
            setIsAlertOpen(true);
            await refreshDataHub();
            if (activeTab === 'company-new') setActiveTab('companies-list');
        } catch (err) {
            setAlertMessage(err.message);
            setIsAlertOpen(true);
        }
    };
    
    const refreshCompanies = async() => {
        try{
            const companies = await API.fetchCompaniesMaster(sessionToken);
            if(!companies) {setAlertMessage("Error in company fetching from backend"); setIsAlertOpen(true);}
            else setCompaniesMaster(Array.isArray(companies) ? companies : []);
            
        }catch(err){
            setAlertMessage(err.message);
            setIsAlertOpen(true);
        }
    };

    const commitCompanySubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditingCompany) {
                await API.updateCompany(selectedCompanyId, companyForm, sessionToken);
                setAlertMessage("Customer profile updated successfully.");
            } else {
                await API.saveCompanyMaster(companyForm, sessionToken);
                setAlertMessage("Customer profile created successfully.");
            }
            setCompanyForm({ ...defaultCompanyForm });
            setIsEditingCompany(false);
            setSelectedCompanyId(null);
            setIsAlertOpen(true);
            await refreshDataHub(); 
            setActiveTab('companies-list');
        } catch (err) { 
            setAlertMessage(err.message); 
            setIsAlertOpen(true); 
        }
    };
    return {companiesMaster, refreshCompanies, triggerNewCompany, triggerEditCompany, deleteCompany, refreshCompanies, commitCompanySubmit,
        indianStates, industrialCities, professionalRoles
     };
}