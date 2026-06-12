export default function PrintOrderTemplate({ orderData }) {
    if (!orderData) return null;

    const totalAmount =
        orderData.items?.reduce((sum, it) => sum + (it.amount || 0), 0) || 0;

    return (
        <div className="print-container">
            <div style={{
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '18px',
                marginBottom: '15px'
            }}>
                SALES ORDER
            </div>

            <div className="print-header-grid">
                <div>
                    <strong>TEMPO INSTRUMENTS PRIVATE LIMITED</strong><br />
                    TOP SYRINGE COMPOUND, 126, W.E. HIGHWAY<br />
                    BEHIND SAMRAT HOTEL, PANDURANG WADI, POST. MIRA<br />
                    DIST. THANE (M.H.) - 401104<br />
                    GSTIN/UIN: 27AAMCS6280R1ZB
                </div>

                <div className="text-right">
                    <strong>Voucher No:</strong> {orderData.order_acceptance_id}<br />
                    <strong>Dated:</strong> {orderData.order_acceptance_date}<br />
                    <strong>Buyer's PO No:</strong> {orderData.purchase_order_number}<br />
                </div>
            </div>

            <div className="print-header-grid">
                <div>
                    <strong>Consignee / Buyer:</strong><br />
                    {orderData.billing_name}<br />
                    {orderData.billing_address}
                </div>

                <div>
                    <strong>Terms of Delivery:</strong><br />
                    Mode/Terms of Payment: {orderData.payment_terms || '30 DAYS AFTER RECEIPT'}
                </div>
            </div>

            <table className="print-table">
                <thead>
                    <tr>
                        <th>SI No.</th>
                        <th>Description</th>
                        <th>HSN/SAC</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th>Rate</th>
                        <th>Disc %</th>
                        <th>Amount</th>
                    </tr>
                </thead>

                <tbody>
                    {orderData.items?.map((item, idx) => (
                        <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                                <strong>{item.item_code}</strong><br />
                                {item.additional_spec_text}
                            </td>
                            <td>{item.hsn_code}</td>
                            <td>{item.quantity}</td>
                            <td>{item.unit_measure}</td>
                            <td>{item.rate}</td>
                            <td>{item.discount_percentage}%</td>
                            <td className="text-right">
                                ₹{item.amount?.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '20px', border: '1px solid #000', padding: '10px' }}>
                <p>
                    <strong>Amount Chargeable (in words):</strong> Indian Rupees Only.
                </p>

                <p className="text-right" style={{ marginTop: '30px' }}>
                    <strong>for TEMPO INSTRUMENTS PRIVATE LIMITED</strong><br />
                    Authorised Signatory
                </p>
            </div>
        </div>
    );
}