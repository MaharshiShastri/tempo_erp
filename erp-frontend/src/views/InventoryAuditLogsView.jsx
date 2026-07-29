export default function InventoryAuditLogsView({state}){

    return(

        <div className="frappe-card">

            <div className="system-header">

                <h3>📒 Inventory Audit Trail</h3>

                <button className="btn-primary" onClick={state.refreshStockLedger}>
                    Refresh
                </button>

            </div>

            <div className="audit-table-container">

    <table className="audit-table">

        <thead>

            <tr>

                <th>Date</th>
                <th>Item</th>
                <th>Movement</th>
                <th style={{textAlign:"center"}}>Qty</th>
                <th style={{textAlign:"center"}}>Before</th>
                <th style={{textAlign:"center"}}>After</th>
                <th>Operator</th>
                <th>Remarks</th>

            </tr>

        </thead>

        <tbody>

            {state.stockLedger.map(log=>(

                <tr key={log.id}>

                    <td className="audit-date">
                        <div>
                            {new Date(log.created_at).toLocaleString()}
                        </div>
                        <small>
                            {new Date(log.created_at).toLocaleTimeString()}
                        </small>
                    </td>

                    <td>

                        <div className="audit-item">

                            <span className="audit-item-code">
                                {log.item_code}
                            </span>

                            <small>
                                {log.item_name}
                            </small>

                        </div>

                    </td>

                    <td>

                        <span className={`movement-tag movement-${log.movement_type.toLowerCase()}`}>

                            {log.movement_type}

                        </span>

                    </td>

                    <td
                        className={
                            log.quantity_change >= 0
                            ? "stock-positive"
                            : "stock-negative"
                        }
                    >
                        {log.quantity_change > 0 && "+"}
                        {log.quantity_change}
                    </td>

                    <td className="stock-number">
                        {log.stock_before}
                    </td>

                    <td className="stock-number">
                        {log.stock_after}
                    </td>

                    <td>{log.operator}</td>

                    <td className="audit-remarks">
                        {log.remarks || "—"}
                    </td>

                </tr>

            ))}

        </tbody>

    </table>
    </div>
    </div>

    );
}