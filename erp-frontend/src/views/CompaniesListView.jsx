import CompanyCard from "../components/shared/CompanyCard.jsx";
export default function CompaniesListView({ state }) {
    return (
        <div className="frappe-card">
            <div className="system-header">
                <h2>Corporate Customer Accounts Registry</h2>
                <button className="btn btn-primary" onClick={() => state.setActiveTab('company-new')}>Add New Enterprise Client Account<kbd style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.8 }}>Alt+N</kbd></button>
            </div>
            <div className="form-grid-layout">
                {state.companiesMaster.map(c => (
                    <CompanyCard key={c.id} company={c} />
                ))}
            </div>
        </div>
    );
};
