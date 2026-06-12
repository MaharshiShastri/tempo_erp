import OrderItemsTable from "./OrderItemsTable";
export default function OrderCard({ order, state}) {
    return (
        <div style={{ marginBottom: '20px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '15px'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dashed var(--border-light)', paddingBottom: '10px'}}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--bg-main)', padding: '4px 8px', borderRadius: 'var(--radius-sm)'}}>{order.order_acceptance_id}</span>
                <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                    Date: {order.order_acceptance_date}
                </h3>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => state.executePrintWorkflow(order, 'order')}>
                        🖨️ Print Order
                    </button>

                    <button className="btn btn-success" onClick={() => state.triggerInvoiceSetupForOrder(order.order_acceptance_id)}>
                        Generate Commercial Invoice
                    </button>
                </div>
            </div>

            <div className="form-grid-layout"
                style={{ marginBottom: '12px', fontSize: '13px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div><strong>Customer Code:</strong> {order.customer_code}</div>

                <div><strong>PO Reference:</strong> {order.purchase_order_number}</div>

                <div><strong>Billing Entity Name:</strong> {order.billing_name}</div>

                <div><strong>Billing Target Address:</strong> {order.billing_address}</div>
            </div>

            <OrderItemsTable items={order.items}/>
        </div>
    );
};