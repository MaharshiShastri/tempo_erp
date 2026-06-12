export default function CompanyEntryFormView({ state }) {
    const industrialCities = ["Mumbai", "Navi Mumbai", "Thane", "Kalyan", "Pune", "Nashik", "Aurangabad", "Nagpur", "Bangalore", "Chennai", "Hyderabad", "Ahmedabad", "New Delhi"];
    const indianStates = ["Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "Gujarat", "Delhi", "Uttar Pradesh", "West Bengal", "Madhya Pradesh", "Rajasthan"];
    const professionalRoles = ["QA/QC", "Production", "Project manager", "Others"];

    return (
        <div className="frappe-card">
            <div className="system-header">
                <h3>Provision New Master Customer Profile Entry</h3>
            </div>
            <form onSubmit={state.commitCompanySubmit}>
                <div className="form-grid-layout" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group grid-span-3">
                        <label className="input-label">Company Registered Legal Name *</label>
                        <input type="text" required className="form-input" value={state.companyForm.name} onChange={e => state.setCompanyForm({...state.companyForm, name: e.target.value})} placeholder="e.g. Tempo Instruments Manufacturing Pvt Ltd" />
                    </div>
                    
                    <div className="form-group grid-span-3">
                        <label className="input-label">Company Address (First Line / Street block) *</label>
                        <input type="text" required className="form-input" value={state.companyForm.address_line_1} onChange={e => state.setCompanyForm({...state.companyForm, address_line_1: e.target.value})} placeholder="Plot No, Industrial Estate, Phase Complex Area..." />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Company City Location *</label>
                        <select className="form-select-native" required value={state.companyForm.city} onChange={e => state.setCompanyForm({...state.companyForm, city: e.target.value})}>
                            <option value="">-- Choose City --</option>
                            {industrialCities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Company Registered State *</label>
                        <select className="form-select-native" required value={state.companyForm.state} onChange={e => state.setCompanyForm({...state.companyForm, state: e.target.value})}>
                            <option value="">-- Choose State --</option>
                            {indianStates.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Postal PIN Code (6-Digits) *</label>
                        <input type="text" required pattern="^[0-9]{6}$" maxLength="6" className="form-input" value={state.companyForm.pincode} onChange={e => state.setCompanyForm({...state.companyForm, pincode: e.target.value})} placeholder="400001" />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Company Representative Name *</label>
                        <input type="text" required className="form-input" value={state.companyForm.contact_name} onChange={e => state.setCompanyForm({...state.companyForm, contact_name: e.target.value})} placeholder="Enter handling executive's full name" />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Representative Corporate Job Title *</label>
                        <select className="form-select-native" required value={state.companyForm.contact_role} onChange={e => state.setCompanyForm({...state.companyForm, contact_role: e.target.value})}>
                            <option value="">-- Select Structural Assignment --</option>
                            {professionalRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Representative Phone Contact Number *</label>
                        <input type="tel" required className="form-input" value={state.companyForm.contact_phone} onChange={e => state.setCompanyForm({...state.companyForm, contact_phone: e.target.value})} placeholder="e.g. +91 9876543210" />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => state.setActiveTab('companies-list')}>Discard Form</button>
                    <button type="submit" className="btn btn-primary">Save Profile Registry<kbd style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.8 }}>Ctrl+S</kbd></button>
                </div>
            </form>
        </div>
    );
};
