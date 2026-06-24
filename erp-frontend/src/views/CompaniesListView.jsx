import CompanyCard from "../components/shared/CompanyCard.jsx";

export default function CompaniesListView({ state }) {
    return (
        <div className="frappe-card" style={{ padding: '20px 30px' }}>
            
            {/* ERPNext Standard List Header */}
            <div className="system-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '15px', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>Customer Accounts</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{state.companiesMaster.length} Corporate entities registered</p>
                </div>
                
                <button className="btn btn-primary" onClick={() => state.triggerNewCompany()} style={{ padding: '6px 16px', fontSize: '13px', fontWeight: '600' }}>
                    + Add Client <kbd style={{ marginLeft: '6px', fontSize: '10px', background: 'var(--bg-surface)', padding: '2px 4px', borderRadius: '3px', border: 'none' }}>Alt+N</kbd>
                </button>
            </div>

            {/* Empty State vs Grid View */}
            {state.companiesMaster.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: '8px', border: '1px dashed var(--border-subtle)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏢</div>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Clients Found</h4>
                    <p style={{ margin: 0, fontSize: '13px' }}>You haven't registered any enterprise customers yet.</p>
                </div>
            ) : (
                <div className="form-grid-layout" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
                    {state.companiesMaster.map(c => (
                        <CompanyCard key={c.id} company={c} state={state}/>
                    ))}
                </div>
            )}
            
        </div>
    );
}