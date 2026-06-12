
export default function PrintInvoiceTemplate({ invoiceData }) {
    if (!invoiceData) return null;

    const totalAmount =
        invoiceData.items?.reduce((sum, it) => sum + (it.amount || 0), 0) || 0;

    const igstAmount = totalAmount * 0.18;

    return (
        <div className="print-container">
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                TAX INVOICE
            </div>

            <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '15px' }}>
                e-Invoice Document
            </div>

            <div className="print-header-grid">
                <div>
                    <strong>TEMPO INSTRUMENTS PRIVATE LIMITED</strong><br />
                    TOP SYRINGE COMPOUND, 126, W.E. HIGHWAY<br />
                    BEHIND SAMRAT HOTEL, PANDURANG WADI, POST. MIRA<br />
                    DIST. THANE (M.H.) - 401104<br />
                    MOB. 9619741622/98204 64003<br />
                    GSTIN/UIN: 27AAMCS6280R1ZB<br />
                    State Name: Maharashtra, Code: 27
                </div>

                <div className="text-right">
                    <strong>Invoice No:</strong> {invoiceData.bill_num}<br />
                    <strong>Dated:</strong> {invoiceData.bill_date}<br />
                    <strong>eWay-Bill No:</strong> SYSTEM_GENERATED<br />
                    <strong>Reference No:</strong> {invoiceData.order_acceptance_id}
                </div>
            </div>

            <table className="print-table">
                <thead>
                    <tr>
                        <th>SI No.</th>
                        <th>Description of Goods</th>
                        <th>HSN/SAC</th>
                        <th>Quantity Shipped</th>
                    </tr>
                </thead>

                <tbody>
                    {invoiceData.items?.map((item, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{item.item_code}</td>
                            <td>90251910</td>
                            <td>{item.quantity_shipped} Nos.</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '20px', border: '1px solid #000', padding: '10px' }}>
                <p><strong>OUTPUT IGST @ 18%:</strong> ₹{igstAmount.toFixed(2)}</p>

                <p>
                    <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                </p>

                <p className="text-right" style={{ marginTop: '30px' }}>
                    <strong>Authorised Signatory</strong>
                </p>
            </div>
        </div>
    );
}