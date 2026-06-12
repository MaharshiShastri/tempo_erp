import BillCard from "../components/shared/BillCard";

export default function BillsListView({ state }) {
    return (
        <div className="frappe-card">
            <div className="system-header">
                <h2>Commercial Dispatch Invoices Master Log</h2>
            </div>
            {state.bills.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No outgoing invoices found inside current session parameters.</p>
            ) : (
                state.bills.map(bill => (
                    <BillCard key={bill.bill_num} bill={bill} onPrint={state.executePrintWorkflow}/>
                ))
            )}
        </div>
    );
};
