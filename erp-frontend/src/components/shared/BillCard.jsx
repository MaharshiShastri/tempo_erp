export default function BillCard({ bill, onPrint }) {
    return (
        <div style={{
            marginBottom: '20px',
            border: '1px solid var(--border-light)',
            borderLeft: '4px solid var(--brand-success)',
            borderRadius: 'var(--radius-sm)',
            padding: '15px'
        }}>
            
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
            }}>
                <span style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    background: 'var(--bg-main)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)'
                }}>
                    {bill.bill_num}
                </span>

                <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                    Invoice Date: {bill.bill_date}
                </h3>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '10px' }}>
                        Source OA: <strong>{bill.order_acceptance_id}</strong>
                    </span>

                    <button
                        className="btn btn-secondary"
                        onClick={() => onPrint?.(bill, 'invoice')}
                    >
                        🖨️ Print Invoice
                    </button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Billing Item Line ID</th>
                            <th>Target Order Item Reference</th>
                            <th>Resolved Item Code</th>
                            <th style={{ textAlign: 'right' }}>Dispatched Quantity</th>
                        </tr>
                    </thead>

                    <tbody>
                        {bill.items?.map((it, idx) => (
                            <tr key={idx}>
                                <td># {it.bill_item_id || 'Pending'}</td>
                                <td style={{ color: 'var(--text-muted)' }}>
                                    Row ID: {it.order_item_id}
                                </td>
                                <td><strong>{it.item_code}</strong></td>
                                <td style={{
                                    textAlign: 'right',
                                    fontWeight: 'bold',
                                    color: 'var(--brand-success)'
                                }}>
                                    {it.quantity_shipped} Units
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}