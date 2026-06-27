import React, { useState, useEffect } from "react";
import API from "../api/api";

export default function AdminUserRegistryView({ state }) {
    const defaultForm = { email: '', name: '', password: '', role: '', dob: '', phone_personal: '', phone_business: '', regions: [] };
    const [form, setForm] = useState({ ...defaultForm });
    const [users, setUsers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const availableRegions = [
        "Amazon", "Andhra Pradesh", "Assam", "Cement", "Central", "Chattisgarh", 
        "Delhi", "East Zone", "Goa", "Gujarat", "Gujarat-STC", "Haryana", 
        "Himachal Pradesh", "J&K", "Kanpur", "Karnataka", "Kerala", "Lucknow", 
        "Madhya Pradesh", "Maharashtra", "Mumbai", "New Delhi", "Pune", 
        "Punjab", "Rajasthan", "Tamil Nadu", "Thane", "UP", "Uttrakhand", 
        "Varanasi", "Vidarbh", "Vizag"
    ];

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await API.fetchUsers(state.user.access_token);
            setUsers(data || []);
        } catch (err) {
            if (state.setAlertMessage && state.setIsAlertOpen) {
                state.setAlertMessage("Failed to fetch users: " + err.message);
                state.setIsAlertOpen(true);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    // Role Change Handler to clear regions if role switches away from Sales
    const handleRoleChange = (newRole) => {
        setForm(prev => ({
            ...prev,
            role: newRole,
            regions: newRole === 'Sales Representative' ? prev.regions : []
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await API.updateUser(form.email, form, state.user.access_token);
            } else {
                const response = await fetch('/api/v1/auth/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.user.access_token}` },
                    body: JSON.stringify(form)
                });
                if (!response.ok) throw new Error("Registration failed. Email might already exist.");
            }

            if (state.setAlertMessage && state.setIsAlertOpen) {
                state.setAlertMessage(`Team Member ${isEditing ? 'Updated' : 'Registered'} Successfully`);
                state.setIsAlertOpen(true);
            }
            
            setForm({ ...defaultForm });
            setIsEditing(false);
            loadUsers();
        } catch(err) { 
            if (state.setAlertMessage && state.setIsAlertOpen) {
                state.setAlertMessage(err.message);
                state.setIsAlertOpen(true);
            } else {
                alert(err.message);
            }
        }
    };

    const handleEditClick = (u) => {
        setForm({
            email: u.email,
            name: u.name,
            password: '', // Leave blank so admin doesn't have to overwrite it to save
            role: u.role,
            dob: u.dob || '',
            phone_personal: u.phone_personal || '',
            phone_business: u.phone_business || '',
            regions: u.regions || []
        });
        setIsEditing(true);
        window.scrollTo(0, 0); // Scroll to top form
    };

    const handleDelete = async (email) => {
        if (!window.confirm(`Are you sure you want to delete ${email} from the system?`)) return;
        try {
            await API.deleteUser(email, state.user.access_token);
            loadUsers();
            if (form.email === email) {
                setForm({ ...defaultForm });
                setIsEditing(false);
            }
        } catch (err) {
            if (state.setAlertMessage && state.setIsAlertOpen) {
                state.setAlertMessage(err.message);
                state.setIsAlertOpen(true);
            }
        }
    };

    const handleCancelEdit = () => {
        setForm({ ...defaultForm });
        setIsEditing(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* TOP: FORM WIDGET */}
            <div className="frappe-card">
                <div className="system-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>{isEditing ? '✏️ Edit Team Member' : '🔐 Provision New Team Member'}</h3>
                    {isEditing && <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancel Edit</button>}
                </div>
                
                <form onSubmit={handleSave} className="form-grid-layout" style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    <div className="form-group">
                        <label className="input-label">Full Name *</label>
                        <input type="text" required className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Business Email (Login ID) *</label>
                        <input type="email" required disabled={isEditing} className="form-input" style={{ backgroundColor: isEditing ? '#f0f0f0' : 'transparent', cursor: isEditing ? 'not-allowed' : 'text'}} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="input-label">{isEditing ? 'New Password (Leave blank to keep current)' : 'Temporary Password *'}</label>
                        <input type="text" required={!isEditing} className="form-input" placeholder={isEditing ? '********' : ''} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Role Definition *</label>
                        <select required className="form-select-native" value={form.role} onChange={e => handleRoleChange(e.target.value)}>
                            <option value="">-- Assign Role Matrix --</option>
                            <option value="Sales Representative">Sales Representative</option>
                            <option value="Dispatch Engineer">Dispatch Engineer</option>
                            <option value="Admin">System Administrator</option>
                            <option value="Shop Floor Worker">Shop Floor Worker</option>
                            <option value="Shop Floor Administrator">Shop Floor Administrator</option>
                            <option value="R&D Engineer"> R&D Engineer</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="input-label">Date of Birth</label>
                        <input type="date" className="form-input" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Personal Phone</label>
                        <input type="text" className="form-input" value={form.phone_personal} onChange={e => setForm({...form, phone_personal: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Business Phone</label>
                        <input type="text" className="form-input" value={form.phone_business} onChange={e => setForm({...form, phone_business: e.target.value})} />
                    </div>
                    
                    {/* DYNAMIC REGIONS WIDGET */}
                    {form.role === 'Sales Representative' && (
                        <div className="form-group grid-span-2">
                            <label className="input-label" style={{ color: 'var(--brand-accent)' }}>Assigned Operational Regions & Territories (Sales Only)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', background: 'var(--bg-surface)', padding: '15px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--brand-accent)' }}>
                                {availableRegions.map(region => (
                                    <label key={region} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', minWidth: '140px' }}>
                                        <input type="checkbox" checked={form.regions.includes(region)} onChange={e => {
                                            if(e.target.checked) setForm({...form, regions: [...form.regions, region]});
                                            else setForm({...form, regions: form.regions.filter(r => r !== region)});
                                        }} /> {region}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid-span-2" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid var(--border-light)' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                            {isEditing ? 'Commit Changes' : 'Provision Member Access'}
                        </button>
                    </div>
                </form>
            </div>

            {/* BOTTOM: DIRECTORY TABLE */}
            <div className="frappe-card">
                <div className="system-header">
                    <h3>👥 Current Team Directory</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                        <thead>
                            <tr style={{ background: "var(--bg-surface)", textAlign: "left", borderBottom: "2px solid var(--border-light)" }}>
                                <th style={{ padding: "12px" }}>Team Member</th>
                                <th style={{ padding: "12px" }}>Role</th>
                                <th style={{ padding: "12px" }}>Business Phone</th>
                                <th style={{ padding: "12px" }}>Territories (If Sales)</th>
                                <th style={{ padding: "12px", textAlign: "right" }}>Manage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: "20px", textAlign: "center" }}>Loading Directory...</td></tr>
                            ) : users.map((u) => (
                                <tr key={u.email} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                    <td style={{ padding: "12px" }}>
                                        <div style={{ fontWeight: "600", color: "var(--text-main)" }}>{u.name}</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{u.email}</div>
                                    </td>
                                    <td style={{ padding: "12px" }}>
                                        <span style={{ padding: "4px 8px", background: "var(--bg-surface)", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", border: "1px solid var(--border-subtle)" }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px", color: "var(--text-muted)" }}>{u.phone_business || 'N/A'}</td>
                                    <td style={{ padding: "12px" }}>
                                        {(u.regions && u.regions.length > 0) ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {u.regions.slice(0, 3).map(r => (
                                                    <span key={r} style={{ fontSize: '10px', background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '10px' }}>{r}</span>
                                                ))}
                                                {u.regions.length > 3 && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{u.regions.length - 3} more</span>}
                                            </div>
                                        ) : <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>None</span>}
                                    </td>
                                    <td style={{ padding: "12px", textAlign: "right" }}>
                                        <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "4px 8px", marginRight: "5px" }} onClick={() => handleEditClick(u)}>Edit</button>
                                        <button className="btn-text-danger" style={{ fontSize: "11px", padding: "4px 8px", background: "var(--bg-surface)", border: "1px solid var(--brand-danger)", borderRadius: "4px" }} onClick={() => handleDelete(u.email)}>Revoke</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}