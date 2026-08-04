import SearchableMultiselect from "../components/shared/SearchableMultiselect";
import { useMemo } from "react";
export default function QuoteGenerationView({state}){
    const productGroups = useMemo(
        () => [
            ...new Set(
                (state?.itemsMaster ?? [])
                    .map(item => item.item_name)
                    .filter(Boolean)
            )
        ].sort(),
        [state?.itemsMaster]
    );

    return (
        <div className="frappe-card">

            <div className="system-header">
                <div>
                    <h2>Quotation Generator</h2>

                    <p style={{margin: 0, color: "var(--text-muted)"}}>
                        Generate quotations from the current Ex-Works price list
                    </p>
                </div>
            </div>

            <form onSubmit={state?.handleGenerateQuote}>

                <h4>Product Selection</h4>

                <SearchableMultiselect label="Product Group" options={productGroups} value={state?.quoteSelectedGroup} onChange={state?.setQuoteSelectedGroup}/>

                <h4 style={{ marginTop: 25 }}>Customer Details</h4>

                <div className="form-grid-layout" style={{gridTemplateColumns:"repeat(2, 1fr)"}}>
                    <div>
                        <label className="input-label">
                            Qoute Number: Tempo/Quote/
                        </label>

                        <input required className="form-input" value={state?.qouteNum} onChange={e=>state?.setQouteNum(e.target.value)} />
                    </div>

                    <div>
                        <label className="input-label">
                            Company
                        </label>

                        <input required className="form-input" value={state?.clientQuoteCompany} onChange={e => state?.setClientQuoteCompany(e.target.value)}/>
                    </div>

                    <div>
                        <label className="input-label">
                            Buyer / Contact Person
                        </label>

                        <input required className="form-input" value={state?.buyerQuoteName} onChange={e => state?.setBuyerQuoteName(e.target.value)}/>
                    </div>

                    <div>
                        <label className="input-label">
                            Email
                        </label>

                        <input required type="email" className="form-input" value={state?.clientQuoteEmail} onChange={e => state?.setClientQuoteEmail(e.target.value)}/>
                    </div>

                    <div>
                        <label className="input-label">
                            Phone
                        </label>

                        <input required className="form-input" value={state?.buyerQouteNum} onChange={e => state?.setBuyerQouteNum(e.target.value)}/>
                    </div>

                    <div>
                        <label className="input-label">
                            Address
                        </label>

                        <input required className="form-input" value={state?.qouteAddress} onChange={e => state?.setQouteAddress(e.target.value)}/>
                    </div>

                    <div>
                        <label className="input-label">
                            City
                        </label>

                        <input required className="form-input" value={state?.qouteCity} onChange={e =>state?.setQouteCity(e.target.value)}/>
                    </div>

                    <div>
                        <label className="input-label">
                            Postal Code
                        </label>

                        <input required className="form-input" value={state?.qoutePostalCode} onChange={e =>state?.setQoutePostalCode(e.target.value)}/>
                    </div>

                    <div>
                        <label className="input-label">
                            Supply
                        </label>

                        <input required className="form-input" value={state?.quoteSupply} onChange={e=>state?.setQuoteSupply(e.target.value)} />
                    </div>

                    <div>
                        <label className="input-label">
                            Installation
                        </label>

                        <input required className="form-input" value={state?.quoteInstallation} onChange={e=>state?.setQuoteInstallation(e.target.value)} />

                    </div>

                    <div>
                        <label className="input-label">
                            Freight
                        </label>

                        <input required className="form-input" value={state?.quoteFreight} onChange={e=>state?.setQuoteFreight(e.target.value)} />
                    </div>

                    <div>
                        <label className="input-label">
                            Customer Enquiry Date
                        </label>

                        <input required type="date" className="form-input" value={state?.qouteDateInput} max={new Date().toISOString().split("T")[0]} onChange={e =>state?.setQouteDateInput(e.target.value)}/>
                    </div>

                    <div style={{marginTop: 20}}>
                        <label className="input-label">
                            <input type="checkbox" checked={state?.quoteDealer} onChange={e=>state?.setQuoteDealer(e.target.value)} />
                            {" "}Dealer quotation
                        </label>
                    </div>
                    
                    <div style={{marginTop: 20}}>
                        <label className="input-label">
                            <input type="checkbox" checked={state?.quoteSpecialModel} onChange={e=>state?.setQuoteSpecialModel(e.target.value)} />
                            {" "}Special Model
                        </label>
                    </div>

                    {state?.quoteSpecialModel && (
                        <div style={{marginTop: 15}}>
                            <label className="input-label">
                                Special Model/Addtional Itinerary
                            </label>

                            <textarea required className="form-input" rows={4} value={state?.quoteSpecialItinerary} onChange={e=>state?.setQuoteSpecialItinerary(e.target.value)} />
                        </div>
                    )}

                </div>

                <button className="btn btn-primary" type="submit" disabled={state?.qouteGenerating} style={{ marginTop: 25 }}>
                    {state?.qouteGenerating ? "Generating..." : "Generate Quotation"}
                </button>

            </form>

        </div>
    );
}