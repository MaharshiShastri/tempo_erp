export default function OrderItemRow({ item}) {
    const quantity = Number(item.quantity ?? 0);
    const rate = Number(item.rate ?? 0);
    const discount = Number(item.discount_percentage ?? 0);

    const total = quantity * rate * (1 - discount / 100);

    return (
        <tr>
            <td><strong>{item.item_code}</strong></td>

            <td>{item.additional_spec_text}</td>

            <td>{item.hsn_code}</td>

            <td>{quantity}</td>

            <td>{item.unit_measure}</td>

            <td>₹{rate.toFixed(2)}</td>

            <td>{discount}%</td>

            <td style={{textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold'}}>₹{total.toFixed(2)}</td>
        </tr>
    );
};