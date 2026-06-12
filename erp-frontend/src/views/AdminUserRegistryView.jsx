import React, {useState} from "react";
export default function AdminUserRegistryView({ state }) {
    const [form, setForm] = React.useState({ email: '', name: '', password: '', role: '', dob: '', phone_personal: '', phone_business: '', regions: [] });
    const availableRegions = ["Mumbai", "Navi Mumbai", "Thane", "Pune", "Gujarat-South", "Delhi-NCR", "Bangalore"];
    
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/v1/auth/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.user.access_token}` },
                body: JSON.stringify(form)
            });
            alert("Team Member Registered Successfully");
            setForm({ email: '', name: '', password: '', role: '', dob: '', phone_personal: '', phone_business: '', regions: [] });
        } catch(err) { alert("Registration failed. Email might already exist."); }
    };

    return (
        <div className="frappe-card">
            <div className="system-header">
                <h3>🔐 Enterprise Directory Management (Admin Restricted)</h3>
            </div>
            
            <form onSubmit={handleRegister} className="form-grid-layout" style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div className="form-group"><label className="input-label">Full Name *</label><input type="text" required className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div className="form-group"><label className="input-label">Business Email (Login ID) *</label><input type="email" required className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="form-group"><label className="input-label">Temporary Password *</label><input type="text" required className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
                <div className="form-group">
                    <label className="input-label">Role Definition *</label>
                    <select required className="form-select-native" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                        <option value="">-- Assign Role Matrix --</option>
                        <option value="Sales Representative">Sales Representative</option>
                        <option value="Dispatch Engineer">Dispatch Engineer</option>
                        <option value="Admin">System Administrator</option>
                        <option value="Factory worker">Shop Floor Worker</option>
                        <option value="Factory administrator">Shop Floor Administrator</option>
                    </select>
                </div>
                <div className="form-group"><label className="input-label">Date of Birth</label><input type="date" className="form-input" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} /></div>
                <div className="form-group"><label className="input-label">Personal Phone</label><input type="text" className="form-input" value={form.phone_personal} onChange={e => setForm({...form, phone_personal: e.target.value})} /></div>
                <div className="form-group"><label className="input-label">Business Phone</label><input type="text" className="form-input" value={form.phone_business} onChange={e => setForm({...form, phone_business: e.target.value})} /></div>
                
                <div className="form-group grid-span-2">
                    <label className="input-label">Assigned Operational Regions</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', background: 'var(--bg-surface)', padding: '15px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        {availableRegions.map(region => (
                            <label key={region} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.regions.includes(region)} onChange={e => {
                                    if(e.target.checked) setForm({...form, regions: [...form.regions, region]});
                                    else setForm({...form, regions: form.regions.filter(r => r !== region)});
                                }} /> {region}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid-span-2" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid var(--border-light)' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>Provision Member Access</button>
                </div>
            </form>
        </div>
    );
};
