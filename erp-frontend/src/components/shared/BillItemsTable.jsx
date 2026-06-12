export default function BillItemsTable({ state }) {
    return (
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
            <table>
                <thead>
                    <tr>
                        <th>Target Order Line ID</th>
                        <th>Item Identifier</th>
                        <th>Ordered Qty</th>
                        <th style={{ textAlign: 'right' }}>Shipped Qty</th>
                    </tr>
                </thead>

                <tbody>
                    {state.billItems?.map((item, idx) => (
                        <tr key={idx}>
                            <td style={{ fontFamily: 'monospace' }}>
                                Row ID #{item.order_item_id}
                            </td>

                            <td><strong>{item.item_code}</strong></td>

                            <td>{item.quantity_ordered} Units</td>

                            <td style={{ textAlign: 'right' }}>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={item.quantity_ordered}
                                    className="form-input"
                                    style={{
                                        width: '90px',
                                        textAlign: 'right',
                                        fontWeight: 'bold',
                                        color: 'var(--brand-success)'
                                    }}
                                    value={item.quantity_shipped}
                                    onChange={(e) => {
                                        const lines = [...state.billItems];
                                        lines[idx].quantity_shipped = parseInt(e.target.value) || 0;
                                        state.setBillItems(lines);
                                    }}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}