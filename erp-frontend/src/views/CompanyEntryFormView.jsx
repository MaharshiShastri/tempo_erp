import React from "react";

export default function CompanyEntryFormView({ state }) {
    const industrialCities = ["Mumbai", "Navi Mumbai", "Thane", "Kalyan", "Pune", "Nashik", "Aurangabad", "Nagpur", "Bangalore", "Chennai", "Hyderabad", "Ahmedabad", "New Delhi"];
    const indianStates = ["Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "Gujarat", "Delhi", "Uttar Pradesh", "West Bengal", "Madhya Pradesh", "Rajasthan"];
    const professionalRoles = ["QA/QC", "Production", "Project manager", "Others"];

    const SectionHeader = ({ title }) => (
        <div style={{ marginTop: '30px', marginBottom: '15px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>{title}</h4>
        </div>
    );

    return (
        <div className="frappe-card" style={{ maxWidth: '1000px', margin: '0 auto', background: 'var(--bg-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: '8px', padding: '20px 30px' }}>
            
            <div className="system-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '15px', marginBottom: '20px' }}>
                <div>
                    {/* DYNAMIC TITLE */}
                    <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>
                        {state.isEditingCompany ? `Edit Profile: ${state.selectedCompanyId}` : "New Customer Profile"}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {state.isEditingCompany ? "Update existing enterprise master account" : "Provision a new enterprise master account"}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    
                    {/* NEW: Delete Button in Header during Edit Mode */}
                    {state.isEditingCompany && (
                        <button type="button" className="btn btn-secondary" style={{ color: 'var(--brand-danger)', borderColor: 'var(--brand-danger)' }} onClick={() => state.deleteCompany(state.selectedCompanyId)}>
                            Delete
                        </button>
                    )}

                    <button type="button" className="btn btn-secondary" onClick={() => state.setActiveTab('companies-list')} style={{ padding: '6px 12px', fontSize: '13px' }}>
                        Discard
                    </button>
                    <button type="submit" form="company-entry-form" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '13px', fontWeight: '600' }}>
                        {state.isEditingCompany ? "Save Changes" : "Save Profile"} <kbd style={{ marginLeft: '6px', fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 4px', borderRadius: '3px', border: 'none' }}>Ctrl+S</kbd>
                    </button>
                </div>
            </div>

            <form id="company-entry-form" onSubmit={state.commitCompanySubmit}>
                
                {/* SECTION 1: Basic Info */}
                <div className="form-grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group grid-span-2">
                        <label className="input-label" style={{ fontWeight: '500' }}>Registered Legal Name *</label>
                        <input type="text" required className="form-input" style={{ fontSize: '15px', padding: '10px' }} value={state.companyForm.name} onChange={e => state.setCompanyForm({...state.companyForm, name: e.target.value})} placeholder="e.g. Tempo Instruments Manufacturing Pvt Ltd" />
                    </div>
                </div>

                <SectionHeader title="Registered Address Details" />
                
                {/* SECTION 2: Address (2-Column Grid) */}
                <div className="form-grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group grid-span-2">
                        <label className="input-label">Address Line 1 (Street/Block) *</label>
                        <input type="text" required className="form-input" value={state.companyForm.address_line_1} onChange={e => state.setCompanyForm({...state.companyForm, address_line_1: e.target.value})} placeholder="Plot No, Industrial Estate, Phase Complex Area..." />
                    </div>

                    <div className="form-group">
                        <label className="input-label">City *</label>
                        <select className="form-select-native" required value={state.companyForm.city} onChange={e => state.setCompanyForm({...state.companyForm, city: e.target.value})}>
                            <option value="">-- Choose City --</option>
                            {industrialCities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="input-label">State / Province *</label>
                        <select className="form-select-native" required value={state.companyForm.state} onChange={e => state.setCompanyForm({...state.companyForm, state: e.target.value})}>
                            <option value="">-- Choose State --</option>
                            {indianStates.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Postal PIN Code *</label>
                        <input type="text" required pattern="^[0-9]{6}$" maxLength="6" className="form-input" value={state.companyForm.pincode} onChange={e => state.setCompanyForm({...state.companyForm, pincode: e.target.value})} placeholder="e.g., 400001" />
                    </div>
                </div>

                <SectionHeader title="Primary Contact Representative" />

                {/* SECTION 3: Contact (2-Column Grid) */}
                <div className="form-grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                        <label className="input-label">Full Name *</label>
                        <input type="text" required className="form-input" value={state.companyForm.contact_name} onChange={e => state.setCompanyForm({...state.companyForm, contact_name: e.target.value})} placeholder="Enter handling executive's name" />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Corporate Designation *</label>
                        <select className="form-select-native" required value={state.companyForm.contact_role} onChange={e => state.setCompanyForm({...state.companyForm, contact_role: e.target.value})}>
                            <option value="">-- Select Role --</option>
                            {professionalRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Direct Phone Number *</label>
                        <input type="tel" required className="form-input" value={state.companyForm.contact_phone} onChange={e => state.setCompanyForm({...state.companyForm, contact_phone: e.target.value})} placeholder="+91 9876543210" />
                    </div>
                </div>
            </form>
        </div>
    );
}