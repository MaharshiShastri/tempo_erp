import { useState } from "react";
import {
    Line,
    Bar,
    Pie
} from "react-chartjs-2";

export default function ProductionAnalyticsView({ state }) {

    const {productionBarChart, productionPieChart, productionLineChart, prodKpis, fetchAnalytics, fromDate, toDate, setFromDate, setToDate} = state;

    const [activeView, setActiveView] = useState("statistics");

    return (

        <div className="print-section">

            {/* Header */}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25}}>

                <div>

                    <h2>🏭 Production Dashboard</h2>

                    <p className="text-muted">Shop Floor Performance Analytics</p>

                </div>

                <div style={{ display: "flex", gap: 15, alignItems: "end"}}>

                    <div className="form-group">
                        <label>From</label>
                        <input className="form-input" type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)}/>
                    </div>

                    <div className="form-group">
                        <label>To</label>
                        <input className="form-input" type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)}/>
                    </div>

                    <button className="btn-primary" onClick={()=>fetchAnalytics("Shop Floor Administrator", fromDate,toDate)}>Refresh</button>

                </div>

            </div>


            {/* Navigation */}
 
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", marginBottom:25, gap:12}}>

                <button className={activeView==="statistics" ? "btn-primary":"btn-text"} onClick={()=>setActiveView("statistics")}>Statistics</button>

                <button className={activeView==="charts" ? "btn-primary":"btn-text"} onClick={()=>setActiveView("charts")} >Charts</button>

                <button className={activeView==="shopfloor" ? "btn-primary":"btn-text"} onClick={()=>setActiveView("shopfloor")}>Shop Floor</button>

            </div>

            {/* ===================== STATISTICS ================= */}

            {activeView==="statistics" && (

                <>

                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20, marginBottom:25 }} >

                        <div className="frappe-card">

                            <h4>Total Production</h4>

                            <h1>{prodKpis?.total_production}</h1>

                        </div>

                        <div className="frappe-card">

                            <h4>Total Batches</h4>

                            <h1>{prodKpis?.total_batches}</h1>

                        </div>

                        <div className="frappe-card">

                            <h4>Average Batch Size</h4>

                            <h1>{prodKpis?.average_batch_size}</h1>

                        </div>

                        <div className="frappe-card">

                            <h4>Operators</h4>

                            <h1>{prodKpis?.total_operators}</h1>

                        </div>

                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:25 }}>

                        {/* Monthly */}

                        <div className="frappe-card">

                            <h3>Monthly Production</h3>

                            <table className="frappe-table">

                                <thead>

                                <tr>

                                    <th>Month</th>
                                    <th>Batches</th>
                                    <th>Produced</th>

                                </tr>

                                </thead>

                                <tbody>

                                {prodKpis?.monthly?.map(m=>(

                                    <tr key={m?.month}>

                                        <td>{m?.month}</td>
                                        <td>{m?.batches}</td>
                                        <td>{m?.quantity}</td>

                                    </tr>

                                ))}

                                </tbody>

                            </table>

                        </div>


                        {/* Operator */}

                        <div className="frappe-card">

                            <h3>Operator Performance</h3>

                            <table className="frappe-table">

                                <thead>

                                <tr>

                                    <th>Operator</th>
                                    <th>Production</th>

                                </tr>

                                </thead>

                                <tbody>

                                {prodKpis?.operator_summary?.map(o=>(

                                    <tr key={o?.operator}>

                                        <td>{o?.operator}</td>

                                        <td>{o?.production}</td>

                                    </tr>

                                ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </>

            )}

            {/* ===================== CHARTS ===================== */}

            {activeView==="charts" && (

                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:25}}>

                    <div className="frappe-card">

                        <Line data={productionLineChart} options={{ responsive:true, maintainAspectRatio:false, plugins:{title:{display:true,text:"Tasks Completed Daily"}}}}/>

                    </div>

                    <div className="frappe-card">
                        {console.log("Production stage KPI: ", prodKpis.production_stage)}
                        <Pie data={productionPieChart} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:"bottom"}}}}/>
                        
                    </div>

                    <div className="frappe-card" style={{gridColumn:"1 / span 2"}}>

                        <Bar data={productionBarChart} options={{responsive: true, maintainAspectRatio: false, plugins:{ title:{ display:true, text:"Tasks Assigned vs Received"}}}}/>

                    </div>

                </div>

            )}

            {/* ===================== SHOP FLOOR ===================== */}

            {activeView==="shopfloor" && (

                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20}}>

                    <div className="frappe-card">

                        <h3>Machine Utilization</h3>

                        <h1>92%</h1>

                    </div>

                    <div className="frappe-card">

                        <h3>Downtime</h3>

                        <h1>1.8%</h1>

                    </div>

                    <div className="frappe-card">

                        <h3>Efficiency</h3>

                        <h1>97%</h1>

                    </div>

                </div>

            )}

        </div>

    );

}