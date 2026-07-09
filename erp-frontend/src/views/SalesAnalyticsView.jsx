import React, { useState, useEffect, useRef } from "react";
import API from "../api/api";
import { FiTrendingUp, FiActivity, FiTruck, FiMapPin, FiPrinter, FiPieChart, FiAlertOctagon, FiTarget, FiDownload, FiUsers, FiPackage, FiMessageSquare  } from "react-icons/fi";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export default function SalesAnalyticsView({ state }) {
    const [salesKpis, setSalesKpis] = useState([]);
    const [rndKpis, setRndKpis] = useState([]);
    const [transportKpis, setTransportKpis] = useState({ total_partners: 0, monthly_costs: [] });
    const [gtmKpis, setGtmKpis] = useState([]);
    const [errorLogs, setErrorLogs] = useState([]);
    const [prodKpis, setProdKpis] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [isExporting, setIsExporting] = useState(false);
    
    // Admin Variable: Set the dynamic cost of API credits
    const [creditCost, setCreditCost] = useState(0.0);
    const [quarterlyTargets, setQuarterlyTargets] = useState({});
    
    const dashboardRef = useRef(null);

    useEffect(() => {
        const fetchAllKPIs = async () => {
            try {
                const [salesData, transportData, rndData, gtmData, errorData, prodData] = await Promise.all([
                    API.fetchSalesKPIs(state.user.access_token),
                    API.fetchTransportKPIs(state.user.access_token),
                    API.fetchRnDKPIs(state.user.access_token),
                    API.fetchGtmAnalytics(state.user.access_token),
                    API.fetchSystemHealth(state.user.access_token),
                    API.fetchProductionKPIs(state.user.access_token)
                ]);
                setSalesKpis(salesData);
                setTransportKpis(transportData);
                setRndKpis(rndData);
                setGtmKpis(gtmData);
                setErrorLogs(errorData);
                setProdKpis(prodData);
            } catch (err) {
                state.showErrorModal("Analytics Error", err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllKPIs();
    }, []);

    const handleExportPDF = async () => {
        if (!dashboardRef.current) return;
        setIsExporting(true);
        state.setAlertMessage("📸 Capturing high-resolution snapshot for PDF...");
        state.setIsAlertOpen(true);

        try {
            const element = dashboardRef.current;
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            state.setAlertMessage("✅ PDF Downloaded Successfully.");
        } catch (error) {
            state.showErrorModal("PDF Generation Failed", error.message);
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Command Center Data...</div>;
    const handleUpdateTarget = async (email) => {
        const targetValue = quarterlyTargets[email];
        if (!targetValue || isNaN(targetValue)) {
            state.showErrorModal("Validation Error", "Please enter a valid target amount.");
            return;
        }

        try {
            // Note: Make sure API.updateQuarterlyTarget is defined in your api.js
            await API.updateQuarterlyTarget(state.user.access_token, email, parseFloat(targetValue));
            state.setAlertMessage(`✅ QTR Target set to ₹${targetValue} for ${email}`);
            state.setIsAlertOpen(true);
        } catch (error) {
            state.showErrorModal("Update Failed", error.message);
        }
    };

    // --- AGGREGATES ---
    const totalQueued = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.targets_queued || 0), 0);
    const totalHarvested = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.targets_harvested || 0), 0);
    const conversionRatio = totalQueued > 0 ? ((totalHarvested / totalQueued) * 100).toFixed(1) : 0;
    const totalCrmLeads = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.total_crm_leads || 0), 0);
    const totalErrors = errorLogs.length;
    const totalFaqAsked = salesKpis.reduce((sum, k) => sum + Number(k.faqs_asked || 0), 0);
    const totalFaqAnswered = rndKpis.reduce((sum, k)=>sum+Number(k.faqs_answered || 0), 0);
    const pendingFaqs = totalFaqAsked - totalFaqAnswered;
    const totalTargets = gtmKpis.reduce((s,g)=>s+Number(g.total_targets||0),0);
    const totalCompleted = gtmKpis.reduce((s,g)=>s+Number(g.completed||0),0);
    const totalRejected = gtmKpis.reduce((s,g)=>s+Number(g.rejected||0),0);
    const totalPending = gtmKpis.reduce((s,g)=>s+Number(g.pending||0),0);
    const completion = totalTargets ? ((totalCompleted/totalTargets)*100).toFixed(1) : 0;
    const reject = totalTargets ? ((totalRejected/totalTargets)*100).toFixed(1) : 0;
    const emailsFound = gtmKpis.reduce((s,g)=>s+Number(g.emails_found||0),0);
    const emailsSent = gtmKpis.reduce((s,g)=>s+Number(g.emails_sent||0),0);
    const replies = gtmKpis.reduce((s,g)=>s+Number(g.replies_received||0),0);
    const deals = gtmKpis.reduce((s,g)=>s+Number(g.deals_closed||0),0);
    const emailYield = totalTargets  ? ((emailsFound/totalTargets)*100).toFixed(1) : 0;
    const replyRate = emailsSent   ? ((replies/emailsSent)*100).toFixed(1) : 0;
    const dealRate = replies  ? ((deals/replies)*100).toFixed(1) : 0;

    // --- CHART DATA GENERATORS ---
    const salesPerformanceChart = {
        labels: salesKpis.map(k => k.name.split(' ')[0]),
        datasets: [
            {
                label: 'Activity Score',
                data: salesKpis.map(k => k.activity_score),
                backgroundColor: salesKpis.map(k => {
                    const score = (parseInt(k.targets_queued) * 2) + (parseInt(k.total_crm_leads) * 5) + (parseInt(k.dispatches_logged) * 10);
                    return score > 50 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'; // Green if good, Red if low
                }),
            }
        ]
    };

    const completionChart={

    labels:gtmKpis.map(g=>g.gtm_source),

    datasets:[

            {

                label:"Completed",

                data:gtmKpis.map(g=>g.completed),

                backgroundColor:"#4CAF50"

            },

            {

                label:"Rejected",

                data:gtmKpis.map(g=>g.rejected),

                backgroundColor:"#F44336"

            },

            {

                label:"Pending",

                data:gtmKpis.map(g=>g.pending),

                backgroundColor:"#FFC107"

            }

        ]

    }

    const faqAskedChart = {
        labels: salesKpis.map(k=>k.name),

        datasets:[
            {
                label:"FAQs Asked",

                data:salesKpis.map(k=>k.faqs_asked),

                backgroundColor:"rgba(255,159,64,0.8)"
            }
        ]
    }

    const faqAnswerChart = {
        labels:rndKpis.map(k=>k.name),

        datasets:[
            {
            label:"Knowledge Score",
            data:rndKpis.map(k=>k.knowledge_score),
            backgroundColor:"rgba(54,162,235,.8)"
            }
        ]
    }
    const productionPieChart = {
        labels: prodKpis.map(p => p.stage),
        datasets: [{
            data: prodKpis.map(p => p.count),
            backgroundColor: [
                'rgba(201, 203, 207, 0.8)', // PO Submitted (Gray)
                'rgba(54, 162, 235, 0.8)',  // Material (Blue)
                'rgba(255, 206, 86, 0.8)',  // In Production (Yellow)
                'rgba(75, 192, 192, 0.8)',  // Ready (Green)
                'rgba(153, 102, 255, 0.8)'  // Dispatched (Purple)
            ],
            borderWidth: 1,
        }]
    };

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
                <button className="btn btn-primary" onClick={handleExportPDF} disabled={isExporting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiDownload /> {isExporting ? "Generating PDF..." : "Export to PDF"}
                </button>
            </div>

            <div ref={dashboardRef} className="frappe-card" style={{ padding: 30, borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-main)' }}>
                
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        .frappe-card, .frappe-card * { visibility: visible; }
                        .frappe-card { position: absolute; left: 0; top: 0; width: 100%; padding: 0px; background: white !important;}
                        .no-print { display: none !important; }
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #ccc !important; padding: 8px !important; }
                        .print-section { page-break-inside: avoid; margin-bottom: 30px; }
                    }
                `}</style>

                <div className="system-header no-print" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px' }}><FiPieChart /> Executive Command Center</h2>
                        <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>Financial data, GTM Evaluation, and System Health</p>
                    </div>
                </div>

                <div className="no-print" style={{ display: "flex", gap: "10px", marginBottom: "25px", overflowX: 'auto', paddingBottom: '10px' }}>
                    <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={`btn ${activeTab === 'faq' ? "btn-primary": "btn-text"}`} onClick={() => setActiveTab("faq")}><FiMessageSquare />F&Q Actions</button>
                    <button className={`btn ${activeTab === 'performance' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('performance')}><FiUsers /> Team Matrix</button>
                    <button className={`btn ${activeTab === 'gtm' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('gtm')}><FiTarget /> GTM ROI</button>
                    <button className={`btn ${activeTab === 'production' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('production')}><FiPackage /> Production Analytics</button>
                    <button className={`btn ${activeTab === 'health' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('health')}><FiAlertOctagon /> System Health</button>
                </div>

                {/* --- TAB: OVERVIEW --- */}
                {(activeTab === 'overview') && (
                    <div className="print-section form-grid-layout" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '30px' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '25px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Targets Queued</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalQueued}</div>
                        </div>
                        <div style={{ background: 'rgba(75, 192, 192, 0.1)', padding: '25px', borderRadius: '8px', border: '1px solid rgba(75, 192, 192, 0.3)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Lead Harvest Ratio</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: conversionRatio > 50 ? 'rgba(75, 192, 192, 1)' : 'var(--brand-danger)' }}>{conversionRatio}%</div>
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '25px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Active CRM Deals</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--brand-success)' }}>{totalCrmLeads}</div>
                        </div>
                        <div style={{ background: 'rgba(255, 99, 132, 0.1)', padding: '25px', borderRadius: '8px', border: '1px solid rgba(255, 99, 132, 0.3)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--brand-danger)', marginBottom: '8px' }}>System Faults</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--brand-danger)' }}>{totalErrors}</div>
                        </div>
                        <br/>
                        <h3>GTM Completion Ratio</h3>
                        <table style={{width:"100%", borderCollapse:"collapse" }}>
                            <thead>
                                <tr>
                                    <th>GTM</th>
                                    <th>Queued</th>
                                    <th>Completed</th>
                                    <th>Rejected</th>
                                    <th>Completion %</th>

                                </tr>

                            </thead>

                            <tbody>

                                {gtmKpis.map(gtm=>{
                                    const ratio = gtm.total_targets ?((gtm.completed/gtm.total_targets)*100).toFixed(1):0;

                                    return(

                                        <tr key={gtm.gtm_source}>

                                            <td>{gtm.gtm_source}</td>

                                            <td>{gtm.total_targets}</td>

                                            <td>{gtm.completed}</td>

                                            <td>{gtm.rejected}</td>

                                            <td>{ratio}%</td>

                                        </tr>

                                    );

                                })}

                            </tbody>

                        </table>
                    </div>
                )}

                {/* --- TAB: TEAM PERFORMANCE --- */}
                {(activeTab === 'performance') && (
                    <div className="print-section">
                        <div style={{ height: '300px', marginBottom: '30px' }}>
                            <Bar data={salesPerformanceChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Sales Team Activity Scores' } } }} />
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-sidebar)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                    <th style={{padding: '12px'}}>Serial number</th>
                                    <th style={{ padding: '12px' }}>Executive Name</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Targets Queued</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Active CRM Deals</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Dispatches</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>QTR Target (₹)</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesKpis.map((kpi, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td style={{padding: '12px'}}>{idx+1}</td>
                                        <td style={{ padding: '12px' }}><strong>{kpi.name}</strong></td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{kpi.targets_queued}</td>
                                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--brand-success)' }}>{kpi.total_crm_leads}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{kpi.dispatches_logged}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}><input type="number" min="0" placeholder="Total QTR Value" defaultValue={kpi.quarterly_target || ""} onChange={(e) => setQuarterlyTargets(prev => ({ ...prev, [kpi.email]: e.target.value }))} style={{  padding: '6px',  borderRadius: '4px',  border: '1px solid var(--border-light)',  width: '120px' }}/></td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}><button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}onClick={() => handleUpdateTarget(kpi.email)}>Save</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab: R&D Knowledge Base */}
                {(activeTab === 'faq') && (
                    <div className="print-section">
                        <h4>Knowledge Base Performance</h4>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"30px",marginBottom:"30px"}}>
                            <div style={{height:320}}>
                                <Bar data={faqAskedChart} options={{responsive:true,maintainAspectRatio:false,plugins:{title:{display:true,text:"Sales Representatives - Questions Asked"}}}}/>
                            </div>
                            <div style={{height:320}}>
                                <Bar data={faqAnswerChart} options={{ responsive:true, maintainAspectRatio:false, plugins:{title:{display:true,text:"R&D Knowledge Scores"}}}}/>
                            </div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"20px"}}>
                            <div className="frappe-card">
                                <h4>Answered</h4>
                                <h2>{totalFaqAnswered}</h2>
                            </div>
                            
                            <div className="frappe-card">
                                <h4>Pending</h4>
                                <h2>{pendingFaqs}</h2>
                            </div>
                            <br/>
                            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"30px"}}>
                                <div>
                                    <h3>Sales Representative Ranking</h3>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Name</th>
                                                <th>Questions</th>
                                                <th>Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salesKpis.sort((a,b)=>b.activity_score-a.activity_score).map((k,i)=>
                                            <tr key={k.email}>
                                                <td>{i+1}</td>
                                                <td>{k.name}</td>
                                                <td>{k.faqs_asked}</td>
                                                <td>{k.activity_score}</td>
                                            </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <h3>R&D Ranking</h3>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Name</th>
                                                <th>Answered</th>
                                                <th>Knowledge Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rndKpis.sort((a,b)=>b.knowledge_score-a.knowledge_score).map((k,i)=>                                            
                                                <tr key={k.email}>
                                                    <td>{i+1}</td>
                                                    <td>{k.name}</td>
                                                    <td>{k.faqs_answered}</td>
                                                    <td>{k.knowledge_score}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: GTM ROI & COSTS --- */}
                {(activeTab === 'gtm') && (
                    <div className="print-section">
                        {/* Dynamic Cost Calculator */}
                        <div className="no-print" style={{ background: '#fff3cd', border: '1px solid #ffeeba', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ fontWeight: 'bold', color: '#856404' }}>Admin: Set API Credit Cost (₹):</div>
                            <input type="number" step="0.001" min="0" value={creditCost} onChange={e => setCreditCost(parseFloat(e.target.value) || 0)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '100px' }} />
                        </div>

                        {/* Cost Per Sales Rep Table */}
                        <div style={{ marginBottom: '30px' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>API Credit Burn Rate (By Sales Rep)</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-sidebar)', borderBottom: '2px solid var(--border-light)' }}>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Sales Executive</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Total Lookups Generated</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Calculated Financial Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesKpis.map((kpi, idx) => {
                                        const repCost = (parseInt(kpi.targets_harvested) * creditCost).toFixed(2);
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{kpi.name}</td>
                                                <td style={{ padding: '10px', textAlign: 'center' }}>{kpi.targets_queued}</td>
                                                <td style={{ padding: '10px', textAlign: 'right', color: repCost > 10 ? 'var(--brand-danger)' : 'var(--text-primary)' }}>
                                                    ₹{repCost}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ height: '350px', marginBottom: '30px' }}>
                            <Bar data={completionChart} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } }, plugins: { title: { display: true, text: 'Lead Completion Status by GTM' } } }} />
                            <br/>
                            <table style={{width:"100%"}}>
                                    <thead>
                                        <tr>
                                            <th>Source</th>
                                            <th>Targets</th>
                                            <th>Emails</th>
                                            <th>Email Yield</th>
                                            <th>Reply Rate</th>
                                            <th>Deal Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>

                                    {gtmKpis.map(g=>{
                                        const yieldRate = g.total_targets ?((g.emails_found/g.total_targets)*100).toFixed(1):0;

                                        const reply = g.emails_sent ?((g.replies_received/g.emails_sent)*100).toFixed(1) :0;

                                        const deal = g.replies_received ?((g.deals_closed/g.replies_received)*100).toFixed(1) :0;

                                        return( 
                                            <tr key={g.gtm_source}>

                                                <td>{g.gtm_source}</td>

                                                <td>{g.total_targets}</td>

                                                <td>{g.emails_found}</td>

                                                <td>{yieldRate}%</td>

                                                <td>{reply}%</td>

                                                <td>{deal}%</td>

                                            </tr>
                                        )
                                    })}
                                    </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB: PRODUCTION ANALYTICS --- */}
                {(activeTab === 'production') && (
                    <div className="print-section" style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                        <div style={{ flex: 1, height: '350px' }}>
                            <Pie data={productionPieChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ marginBottom: '15px' }}>Active Order Staging</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <tbody>
                                    {prodKpis.map((k, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{k.stage.replace(/_/g, ' ')}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontSize: '16px', color: 'var(--brand-accent)' }}>{k.count}</td>
                                        </tr>
                                    ))}
                                    {prodKpis.length === 0 && <tr><td style={{padding: '20px'}}>No active orders on floor.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB: SYSTEM HEALTH --- */}
                {(activeTab === 'health') && (
                    <div className="print-section">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-sidebar)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                    <th style={{ padding: '12px 15px' }}>Timestamp</th>
                                    <th style={{ padding: '12px 15px' }}>API Route</th>
                                    <th style={{ padding: '12px 15px' }}>Exception Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {errorLogs.length === 0 ? (
                                    <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px', color: 'var(--brand-success)'}}>✅ Server is operating perfectly.</td></tr>
                                ) : (
                                    errorLogs.map((log, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 99, 132, 0.05)' }}>
                                            <td style={{ padding: '12px 15px', color: 'var(--text-muted)' }}>{log.created_at.split('.')[0].replace('T', ' ')}</td>
                                            <td style={{ padding: '12px 15px', fontFamily: 'monospace', fontWeight: 'bold' }}>{log.route_path}</td>
                                            <td style={{ padding: '12px 15px', color: 'var(--brand-danger)' }}>{log.error_message}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}