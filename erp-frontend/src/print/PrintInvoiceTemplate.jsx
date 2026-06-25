import React from 'react';

export default function PrintInvoiceTemplate({ invoiceData }) {
    if (!invoiceData) return null;

    // Fallback parsing (since bill_items might not have rate/amount joined from order_items in standard fetch)
    const items = invoiceData.items || [];
    
    // Derived Calculations
    const totalTaxableAmount = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    const cgstAmount = totalTaxableAmount * 0.09;
    const sgstAmount = totalTaxableAmount * 0.09;
    const grandTotal = totalTaxableAmount + cgstAmount + sgstAmount;

    // Number to Words Converter (Simplified for Invoice)
    const numberToWords = (num) => {
        return `Indian Rupees ${Math.round(num).toLocaleString('en-IN')} Only`;
    };

    return (
        <div className="print-invoice-wrapper" style={{ width: '210mm', minHeight: '297mm', padding: '10mm', margin: '0 auto', backgroundColor: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.4' }}>
            
            {/* CSS to isolate this component during window.print() */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-invoice-wrapper, .print-invoice-wrapper * { visibility: visible; }
                    .print-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
                    .no-print { display: none !important; }
                }
                .invoice-border { border: 1px solid #000; }
                .border-bottom { border-bottom: 1px solid #000; }
                .border-right { border-right: 1px solid #000; }
                .border-top { border-top: 1px solid #000; }
                .invoice-table { width: 100%; border-collapse: collapse; }
                .invoice-table th, .invoice-table td { border-right: 1px solid #000; padding: 4px 6px; vertical-align: top; }
                .invoice-table th { border-bottom: 1px solid #000; text-align: left; }
                .invoice-table th:last-child, .invoice-table td:last-child { border-right: none; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
            `}</style>

            <div className="invoice-border">
                {/* Header */}
                <div className="border-bottom text-center" style={{ padding: '6px' }}>
                    <div className="font-bold" style={{ fontSize: '16px' }}>TAX INVOICE</div>
                    <div style={{ fontSize: '10px' }}>ISSUED UNDER RULE 46 OF CGST RULE-2017</div>
                    <div className="font-bold">e-Invoice</div>
                </div>

                {/* IRN Section */}
                <div className="border-bottom" style={{ display: 'flex', padding: '6px' }}>
                    <div style={{ width: '15%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Placeholder for QR Code */}
                        <div style={{ width: '80px', height: '80px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#666' }}>QR CODE</div>
                    </div>
                    <div style={{ width: '85%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>IRN</span><span>: SYSTEM_GENERATED_HASH_PLACEHOLDER</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Ack No.</span><span>: {Date.now().toString().slice(-12)}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Ack Date</span><span>: {invoiceData.bill_date || new Date().toISOString().split('T')[0]}</span></div>
                    </div>
                </div>

                {/* Dispatch / Company Info */}
                <div className="border-bottom" style={{ display: 'flex' }}>
                    
                    {/* Left Column - Seller */}
                    <div className="border-right" style={{ width: '50%', padding: '6px' }}>
                        <div className="font-bold" style={{ fontSize: '13px' }}>TEMPO INSTRUMENTS PRIVATE LIMITED</div>
                        <div>TOP SYRINGE COMPOUND, 126, W.E. HIGHWAY<br/>BEHIND SAMRAT HOTEL, PANDURANG WADI<br/>POST. MIRA, DIST. THANE (M.H.) - 401104</div>
                        <div>MOB. 96197 41622 / 98204 64003</div>
                        <div><span className="font-bold">GSTIN/UIN:</span> 27AAMCS6280R1ZB</div>
                        <div><span className="font-bold">State Name:</span> Maharashtra, Code: 27</div>
                        <div><span className="font-bold">CIN:</span> U29268MH2008PTC186404</div>
                    </div>

                    {/* Right Column - Invoice Metadata */}
                    <div style={{ width: '50%' }}>
                        <div className="border-bottom" style={{ display: 'flex' }}>
                            <div className="border-right" style={{ width: '50%', padding: '4px 6px' }}>
                                <div>Invoice No.</div>
                                <div className="font-bold">{invoiceData.bill_num}</div>
                            </div>
                            <div style={{ width: '50%', padding: '4px 6px' }}>
                                <div>Dated</div>
                                <div className="font-bold">{invoiceData.bill_date}</div>
                            </div>
                        </div>
                        <div className="border-bottom" style={{ display: 'flex' }}>
                            <div className="border-right" style={{ width: '50%', padding: '4px 6px' }}>
                                <div>Delivery Note</div>
                            </div>
                            <div style={{ width: '50%', padding: '4px 6px' }}>
                                <div>Mode/Terms of Payment</div>
                                <div className="font-bold">30% ADV. & BAL. A/G. PRO. INV.</div>
                            </div>
                        </div>
                        <div className="border-bottom" style={{ display: 'flex' }}>
                            <div className="border-right" style={{ width: '50%', padding: '4px 6px' }}>
                                <div>Reference No. & Date.</div>
                                <div className="font-bold">{invoiceData.order_acceptance_id}</div>
                            </div>
                            <div style={{ width: '50%', padding: '4px 6px' }}>
                                <div>Other References</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <div className="border-right" style={{ width: '50%', padding: '4px 6px' }}>
                                <div>Dispatched through</div>
                                <div className="font-bold">CUSTOMER WILL ARRANGE TRANSPORT</div>
                            </div>
                            <div style={{ width: '50%', padding: '4px 6px' }}>
                                <div>Destination</div>
                                <div className="font-bold">ON-SITE</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buyer Info */}
                <div className="border-bottom" style={{ display: 'flex' }}>
                    <div className="border-right" style={{ width: '50%', padding: '6px' }}>
                        <div>Consignee (Ship to)</div>
                        <div className="font-bold" style={{ fontSize: '12px' }}>{invoiceData.billing_name || "STANDARD CLIENT PROFILE"}</div>
                        <div style={{ minHeight: '40px' }}>{invoiceData.billing_address || "Registered Address Vector\nCity, State - Pincode"}</div>
                        <div style={{ display: 'flex' }}><span style={{ width: '70px' }}>GSTIN/UIN</span><span>: UNREGISTERED</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '70px' }}>State Name</span><span>: Maharashtra, Code: 27</span></div>
                    </div>
                    <div style={{ width: '50%', padding: '6px' }}>
                        <div>Buyer (Bill to)</div>
                        <div className="font-bold" style={{ fontSize: '12px' }}>{invoiceData.billing_name || "STANDARD CLIENT PROFILE"}</div>
                        <div style={{ minHeight: '40px' }}>{invoiceData.billing_address || "Registered Address Vector\nCity, State - Pincode"}</div>
                        <div style={{ display: 'flex' }}><span style={{ width: '70px' }}>GSTIN/UIN</span><span>: UNREGISTERED</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '70px' }}>State Name</span><span>: Maharashtra, Code: 27</span></div>
                    </div>
                </div>

                {/* Items Table */}
                <div style={{ minHeight: '300px' }}>
                    <table className="invoice-table" style={{ height: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '5%' }}>SI No</th>
                                <th style={{ width: '35%' }}>Description of Goods</th>
                                <th style={{ width: '10%' }}>HSN/SAC</th>
                                <th style={{ width: '8%' }}>Quantity</th>
                                <th style={{ width: '12%', textAlign: 'right' }}>Rate</th>
                                <th style={{ width: '5%' }}>per</th>
                                <th style={{ width: '8%', textAlign: 'right' }}>Disc. %</th>
                                <th style={{ width: '17%', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="text-center">{idx + 1}</td>
                                    <td>
                                        <div className="font-bold">{item.item_code}</div>
                                        {item.additional_spec_text && <div style={{ fontSize: '10px', whiteSpace: 'pre-wrap' }}>{item.additional_spec_text}</div>}
                                    </td>
                                    <td>{item.hsn_code || "84213990"}</td>
                                    <td className="font-bold">{item.quantity_shipped || item.quantity} Nos.</td>
                                    <td className="text-right">{Number(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td>Nos.</td>
                                    <td className="text-right">{item.discount_percentage || 0}%</td>
                                    <td className="font-bold text-right">{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}

                            {/* Tax Rows */}
                            <tr>
                                <td></td>
                                <td className="text-right font-bold">OUTPUT CGST @ 9%</td>
                                <td></td><td></td><td></td><td>9%</td><td></td>
                                <td className="font-bold text-right">{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td></td>
                                <td className="text-right font-bold">OUTPUT SGST @ 9%</td>
                                <td></td><td></td><td></td><td>9%</td><td></td>
                                <td className="font-bold text-right">{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            
                            {/* Empty space filler */}
                            <tr style={{ height: '100%' }}>
                                <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Sub Total Row */}
                <div className="border-top border-bottom" style={{ display: 'flex' }}>
                    <div className="border-right text-right font-bold" style={{ width: '75%', padding: '6px' }}>Total</div>
                    <div className="border-right text-center font-bold" style={{ width: '8%', padding: '6px' }}>
                        {items.reduce((sum, it) => sum + (Number(it.quantity_shipped) || Number(it.quantity) || 0), 0)} Nos.
                    </div>
                    <div className="text-right font-bold" style={{ width: '17%', padding: '6px' }}>
                        ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                {/* Amount in Words */}
                <div className="border-bottom" style={{ padding: '6px' }}>
                    <div>Amount Chargeable (in words)</div>
                    <div className="font-bold">{numberToWords(grandTotal)}</div>
                    <div className="text-right">E. & O.E</div>
                </div>

                {/* Tax Breakdown Table */}
                <div>
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th rowSpan="2" style={{ width: '15%' }}>HSN/SAC</th>
                                <th rowSpan="2" style={{ width: '15%', textAlign: 'right' }}>Taxable Value</th>
                                <th colSpan="2" className="text-center">CGST</th>
                                <th colSpan="2" className="text-center">SGST/UTGST</th>
                                <th rowSpan="2" style={{ width: '15%', textAlign: 'right' }}>Total Tax Amount</th>
                            </tr>
                            <tr>
                                <th style={{ width: '8%', textAlign: 'right' }}>Rate</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>Amount</th>
                                <th style={{ width: '8%', textAlign: 'right' }}>Rate</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Aggregate</td>
                                <td className="text-right">{totalTaxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="text-right">9%</td>
                                <td className="text-right">{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="text-right">9%</td>
                                <td className="text-right">{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="text-right">{(cgstAmount + sgstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="border-top font-bold">
                                <td className="text-right">Total</td>
                                <td className="text-right">{totalTaxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td></td>
                                <td className="text-right">{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td></td>
                                <td className="text-right">{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className="text-right">{(cgstAmount + sgstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Amount in Words (Tax) */}
                <div className="border-bottom" style={{ padding: '6px' }}>
                    <div>Tax Amount (in words): <span className="font-bold">{numberToWords(cgstAmount + sgstAmount)}</span></div>
                </div>

                {/* Footer Declaration & Signature */}
                <div style={{ display: 'flex', minHeight: '120px' }}>
                    <div className="border-right" style={{ width: '50%', padding: '6px' }}>
                        <div>Company's PAN : <span className="font-bold">AAMCS6280R</span></div>
                        <div style={{ marginTop: '10px', textDecoration: 'underline' }}>Declaration</div>
                        <div>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
                        <div className="font-bold" style={{ marginTop: '15px' }}>SUBJECT TO MUMBAI JURISDICTION</div>
                        <div className="font-bold">This is a Computer Generated Invoice</div>
                    </div>
                    <div style={{ width: '50%', padding: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div className="font-bold text-right" style={{ fontSize: '13px' }}>for TEMPO INSTRUMENTS PRIVATE LIMITED</div>
                        <div className="text-right" style={{ marginTop: '50px' }}>
                            <div className="font-bold">Authorised Signatory</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}