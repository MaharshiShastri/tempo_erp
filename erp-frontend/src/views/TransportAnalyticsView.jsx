import {useState} from "react";
import { Line, Pie } from "react-chartjs-2";
import GeoAnalyticsView from "./GeoAnalyticsView";

export default function TransportAnalyticsView({state}){
    const {transportChart, transportKpis, partnerPie} = state;
    const [activeView, setActiveView] = useState("statistics");
    
    return(
        <>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"end", marginBottom:25}}>

            <div>
                <h2>Transport Analytics</h2>
                <p style={{color:"var(--text-muted)"}}>
                    Logistics performance dashboard
                </p>
            </div>

            <div style={{display:"flex",gap:12,alignItems:"end"}}>

                <div className="form-group">
                    <label>From</label>
                    <input type="date" className="form-input" value={state.fromDate} onChange={(e)=>state.setFromDate(e.target.value)}/>
                </div>

                <div className="form-group">
                    <label>To</label>
                    <input type="date" className="form-input" value={state.toDate} max={new Date().toISOString().split("T")[0]} onChange={(e)=>state.setToDate(e.target.value)}/>
                </div>

                <button className="btn-primary" onClick={()=>state.fetchAnalytics(state.fromDate,state.toDate)} >Refresh</button>
            </div>

        </div>
        <div className="print-section">
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"20px", marginBottom:"30px"}}>
                <button className={activeView==="statistics" ? "btn-primary" : "btn-text"} onClick={()=>setActiveView("statistics")}>Statistics</button>
                <button className={activeView==="charts" ? "btn-primary" : "btn-text"} onClick={()=>setActiveView("charts")}>Charts</button>
                <button className={activeView==="geo" ? "btn-primary" : "btn-text"} onClick={()=>setActiveView("geo")}>Geo Analytics</button>
            </div>

            {activeView==="statistics" &&(
                <div style={{display: "grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 20, marginBottom: 25}}>
                    <div className="frappe-card">
                        <h4>Total Logistics Partners</h4>
                        <h2 style={{color: "var(--brand-accent) !important"}}>{transportKpis?.total_partners}</h2>
                    </div>

                    <div className="frappe-card">
                        <h4>Total Dispatches</h4>
                        <h2 style={{color: "var(--brand-success) !important"}}>{transportKpis?.total_dispatches}</h2>
                    </div>

                    <div className="frappe-card">
                        <h4>Total Freight Spend</h4>
                        <h2 style={{color: "var(--brand-danger) !important"}}>₹{transportKpis?.total_cost.toLocaleString()}</h2>
                    </div>

                    <div className="frappe-card">
                        <h4>Average Freight</h4>
                        <h2 style={{color: "var(--text-muted) !important"}}>₹{transportKpis?.average_dispatch_cost}</h2>
                    </div>

                    <div className="frappe-card">

                        <h3>Monthly Summary</h3>

                        <table style={{width:"100%", borderCollapse:"collapse"}}>

                            <thead>

                                <tr>

                                    <th>Month</th>

                                    <th>Dispatches</th>

                                    <th>Total Cost</th>

                                    <th>Average</th>
                                </tr>

                            </thead>

                            <tbody>

                                {transportKpis?.monthly_costs?.map(month=>(

                                    <tr key={month.month_period}>

                                        <td>{month.month_period}</td>

                                        <td>{month.total_dispatches}</td>

                                        <td>₹{Number(month.total_cost).toLocaleString()}</td>

                                        <td>₹{(Number(month.total_cost)/Number(month.total_dispatches||1)).toFixed(0)}</td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                    <div style={{marginTop:30}}>

                        <h3>Dispatch Records</h3>

                        {Object.entries(transportKpis?.dispatch_records ?? {}).map(([month,records])=>(

                        <div key={month} className="frappe-card" style={{hieght: 500, overflowY: "auto"}}>

                            <summary style={{ cursor:"pointer", padding:"12px", fontWeight:600}}>

                                {month}
                                {" "}
                                ({records.length} Dispatches)

                            </summary>

                            <table style={{ width:"100%", borderCollapse:"collapse", maxWidth:'100vw'}}>

                                <thead>

                                    <tr>

                                        <th>Partner</th>

                                        <th>Zone</th>

                                        <th>Weight</th>

                                        <th>Subtotal</th>

                                        <th>GST</th>

                                        <th>Operator</th>

                                        <th>Date</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {records.map(record=>(

                                        <tr key={record.id}>

                                            <td>{record.partner_name}</td>

                                            <td>{record.destination_zone}</td>

                                            <td>{record.chargeable_weight}</td>

                                            <td>₹{record.subtotal.toLocaleString()}</td>

                                            <td>₹{record.gst.toLocaleString()}</td>

                                            <td>{record.operator}</td>

                                            <td>{record.created_at}</td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>
                    ))}
                    </div>
                </div>
            )}
            {activeView==="charts" && (
                <div style={{display: "grid", gridTemplateColumns:"2fr 1fr", gap:20}}>
                    <div className="frappe-card">
                    <Line data={transportChart} options={{ responsive:true,maintainAspectRatio:false, plugins:{ title:{ display:true, text:"Monthly Logistics Spend"} }}}/>
                    </div>
                    <div className="frappe-card">
                    <Pie data={partnerPie} options={{ responsive:true, plugins:{ title:{ display:true, text:"Dispatches by Logistics Partner"}}}}/>
                    </div>
                </div>

            )}
                
            {activeView==="geo" && (
                <GeoAnalyticsView state={state}/>
            )}
                
        </div>
    </>
    );
}