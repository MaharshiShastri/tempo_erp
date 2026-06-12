export default function OrderItemRow({ item}) {
    const total = item.quantity * item.rate * (1 - (item.discount_percentage || 0) / 100);

    return (
        <tr>
            <td><strong>{item.item_code}</strong></td>

            <td>{item.additional_spec_text}</td>

            <td>{item.hsn_code}</td>

            <td>{item.quantity}</td>

            <td>{item.unit_measure}</td>

            <td>₹{item.rate.toFixed(2)}</td>

            <td>{item.discount_percentage || 0}%</td>

            <td style={{textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold'}}>₹{total.toFixed(2)}</td>
        </tr>
    );
};