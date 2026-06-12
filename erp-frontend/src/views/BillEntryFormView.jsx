import BillItemsTable from "../components/shared/BillItemsTable";
export default function BillEntryFormView({ state }) {
    const today = new Date().toISOString().split('T')[0];
    return (
        <div className="frappe-card">
            <div className="system-header">
                <h3>Compile Invoice Dispatch Node</h3>
            </div>

            <form onSubmit={state.commitBillSubmit}>
                <div className="form-grid-layout" style={{ gridTemplateColumns:'repeat(3, 1fr)'}}>
                    <div className="form-group">
                        <label className="input-label">
                            Commercial Invoice Code *
                        </label>

                        <input type="text" required className="form-input" value={state.billHeader.bill_num} onChange={e => state.setBillHeader({...state.billHeader, bill_num: e.target.value})}/>
                    </div>

                    <div className="form-group">
                        <label className="input-label">
                            Invoice Billing Date *
                        </label>

                        <input type="date" required className="form-input" max={today} value={state.billHeader.bill_date} onChange={e =>state.setBillHeader({...state.billHeader,bill_date: e.target.value})}/>
                    </div>

                    <div className="form-group">
                        <label className="input-label">
                            Linked Order ID Link
                        </label>

                        <input type="text" disabled className="form-input" style={{opacity: 0.6,fontFamily: 'monospace',fontSize: '11px'}} value={state.billHeader.order_acceptance_id}/>
                    </div>

                </div>

                <BillItemsTable state={state} />

                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop:'1px solid var(--border-light)', paddingTop: '15px'}}>
                    <button type="button" className="btn btn-secondary" onClick={() => state.setActiveTab('orders-list')}>Cancel <kbd style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.8 }}>Esc</kbd></button>
                    <button type="submit" className="btn btn-success">Verify & Log Commercial Invoice <kbd style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.8 }}>Ctrl+S</kbd></button>
                </div>

            </form>
        </div>
    );
};