import OrderItemRow from "./OrderItemRow";
export default function OrderItemsTable({ items }) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table>
                <thead>
                    <tr>
                        <th>Item Code</th>
                        <th>Specifications Description</th>
                        <th>HSN</th>
                        <th>Vol</th>
                        <th>Per</th>
                        <th>Rate</th>
                        <th>Disc %</th>
                        <th style={{ textAlign: 'right' }}>
                            Net Calculated Amount
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((item, idx) => (<OrderItemRow key={idx} item={item}/>))}
                </tbody>
            </table>
        </div>
    );
};