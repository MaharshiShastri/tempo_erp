import OrderCard from "../components/shared/OrderCard";
export default function OrdersListView({ state }) {
    return (
        <div className="frappe-card">
            <div className="system-header">
                <h2>Order Acceptance Manifest Ledgers</h2>
                <button className="btn btn-primary" onClick={() => state.triggerNewOrderInitialization()}>New Order Confirmation<kbd style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.8 }}>Alt+N</kbd></button>
            </div>
            {state.orders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No processed orders found inside server cache.</p>
            ) : (
                state.orders.map(order => (
                    <OrderCard
                        key={order.order_acceptance_id}
                        order={order}
                        state={state}
                    />
                ))
            )}
        </div>
    );
};
