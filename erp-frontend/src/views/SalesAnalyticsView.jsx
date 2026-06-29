import React, { useState, useEffect, useRef } from "react";
import API from "../api/api";
import { FiTrendingUp, FiActivity, FiTruck, FiPrinter, FiPieChart, FiAlertOctagon, FiTarget } from "react-icons/fi";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SalesAnalyticsView({ state }) {
    const [salesKpis, setSalesKpis] = useState([]);
    const [rndKpis, setRndKpis] = useState([]);
    const [transportKpis, setTransportKpis] = useState({ total_partners: 0, monthly_costs: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [isExporting, setIsExporting] = useState(false);
    const [gtmKpis, setGtmKpis] = useState([]);
    const [errorLogs, setErrorLogs] = useState([]);

    const dashboardRef = useRef(null);

    useEffect(() => {
        const fetchAllKPIs = async () => {
            try {
                const [salesData, transportData, rndData, gtmData, errorData] = await Promise.all([
                    API.fetchSalesKPIs(state.user.access_token),
                    API.fetchTransportKPIs(state.user.access_token),
                    API.fetchRnDKPIs(state.user.access_token),
                    API.fetchGtmAnalytics(state.user.access_token),
                    API.fetchSystemHealth(state.user.access_token)
                ]);
                setSalesKpis(salesData);
                setTransportKpis(transportData);
                setRndKpis(rndData);
                setGtmKpis(gtmData);
                setErrorLogs(errorData);
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
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1b1b29' : '#ffffff' 
            });

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
            console.error("PDF Export failed:", error);
            state.showErrorModal("PDF Generation Failed", "Could not render the document. " + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    const gtmChartData = {
    labels: ['April', 'May', 'June'], // Dynamically generate based on last 3 months
    datasets: [
        {
            label: 'Snov.io Leads',
            data: [45, 60, 85],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
        {
            label: 'Manual Generation',
            data: [20, 15, 10],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
        },
        {
            label: 'Website Inbound',
            data: [10, 25, 40],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
        }
    ],
};
    if (isLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Command Center Data...</div>;
    }

    const totalQueued = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.targets_queued || 0), 0);
    const totalHarvested = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.targets_harvested || 0), 0);
    const conversionRatio = totalQueued > 0 ? ((totalHarvested / totalQueued) * 100).toFixed(1) : 0;
    const totalCrmLeads = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.total_crm_leads || 0), 0);
    const totalFaqsAsked = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.faqs_asked || 0), 0);
    const totalErrors = errorLogs.length;

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
                <button className="btn btn-primary" onClick={handleExportPDF} disabled={isExporting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                    <FiDownload /> {isExporting ? "Generating PDF..." : "Export to PDF"}
                </button>
            </div>

            <div ref={dashboardRef} className="frappe-card" style={{ padding: 30, borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-main)' }}>
                
                {/* Print Isolation Styles */}
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        .frappe-card, .frappe-card * { visibility: visible; }
                        .frappe-card { position: absolute; left: 0; top: 0; width: 100%; padding: 0px; background: white !important;}
                        .frappe-card {
                            --bg-main: #ffffff !important;
                            --bg-surface: #f9f9f9 !important;
                            --border-light: #dddddd !important;
                            --border-subtle: #eeeeee !important;
                            --text-primary: #000000 !important;
                            --text-muted: #444444 !important;
                            color: black !important;
                        }
                        .no-print { display: none !important; }
                        .print-header { text-align: center; margin-bottom: 30px; font-size: 20px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 10px; display: block !important; color: black; }
                        table { border-collapse: collapse; }
                        th, td { border: 1px solid #ccc !important; }
                        .print-section { page-break-inside: avoid; margin-bottom: 30px; }
                    }
                `}</style>

                <div style={{ marginBottom: "30px", borderBottom: "1px solid var(--border-light)", paddingBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px' }}>
                            <FiPieChart /> Executive Command Center
                        </h2>
                        <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Financial data, GTM Source Evaluation, and System Health
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <strong>Generated:</strong> {new Date().toLocaleString()}
                    </div>
                </div>

                <div className="no-print" style={{ display: "flex", gap: "10px", marginBottom: "25px" }} data-html2canvas-ignore="true">
                    <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('overview')}>General Overview</button>
                    <button className={`btn ${activeTab === 'performance' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('performance')}><FiUsers /> Team Performance</button>
                    <button className={`btn ${activeTab === 'financial' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('financial')}><FiTruck /> Logistics & Financials</button>
                    <button className={`btn ${activeTab === 'GTM' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('GTM')}><FiTarget />GTM analytics</button>
                    <button className={`btn ${activeTab === 'health' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('health')}><FiAlertOctagon />System analytics</button>
                </div>

                {/* Print Only Header */}
                <div style={{ display: "none" }} className="print-header">
                    TEMPO INSTRUMENTS - EXECUTIVE ANALYTICS REPORT<br/>
                    <span style={{ fontSize: "12px", fontWeight: "normal" }}>Generated: {new Date().toLocaleString()}</span>
                </div>

                {/* --- TAB: OVERVIEW --- */}
                {(activeTab === 'overview') && (
                    <div className="print-section form-grid-layout" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '30px' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '25px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Lead Targets Queued</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalQueued}</div>
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '25px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Lead-to-Contact Harvest Ratio</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: conversionRatio > 50 ? 'var(--brand-success)' : 'var(--brand-accent)' }}>
                                {conversionRatio}%
                            </div>
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '25px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Active CRM Pipeline & FAQs</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--brand-success)' }}>{totalCrmLeads} <span style={{fontSize: '14px', color: 'var(--text-muted)'}}>({totalFaqsAsked} FAQs)</span></div>
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '25px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Active Carrier Network</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--brand-accent)' }}>{transportKpis.total_partners}</div>
                        </div>
                        <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-danger-light, #f8d7da)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Internal Server Faults</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--brand-danger)' }}>{totalErrors}</div>
                        </div>
                    </div>
                )}

                {/* --- TAB: TEAM PERFORMANCE --- */}
                {(activeTab === 'performance') && (
                    <div className="print-section" style={{ marginBottom: "40px" }}>
                        
                        {/* SALES PERFORMANCE TABLE */}
                        <h4 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "12px", display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '18px' }}>
                            <FiActivity /> Sales Force Activity Matrix
                        </h4>
                        <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)', overflowX: 'auto', marginTop: '15px', marginBottom: '30px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-sidebar)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                        <th style={{ padding: '15px', color: 'var(--text-primary)' }}>Executive Name</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)' }}>Targets<br/>(Queued/Harvested)</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)' }}>Active Deals<br/>(CRM)</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)' }}>Dispatches<br/>Processed</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)' }}>R&D FAQs<br/>Asked</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)' }}>Activity Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesKpis.map((kpi, idx) => {
                                        // Expanded Formula: Targets(x2) + CRM(x5) + Dispatches(x10) + FAQs(x3) + General Actions(x0.5)
                                        const baseScore = (parseInt(kpi.targets_queued) * 2) + (parseInt(kpi.total_crm_leads) * 5) + (parseInt(kpi.dispatches_logged) * 10) + (parseInt(kpi.faqs_asked) * 3);
                                        const actionBonus = Math.floor(parseInt(kpi.actions_logged) * 0.5);
                                        const score = baseScore + actionBonus;

                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '15px' }}>{kpi.name}</strong>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{kpi.email}</span>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)' }}>
                                                    {kpi.targets_queued} / <span style={{ color: 'var(--brand-success)', fontWeight: 'bold' }}>{kpi.targets_harvested}</span>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>{kpi.total_crm_leads}</td>
                                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>{kpi.dispatches_logged}</td>
                                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: 'var(--brand-accent)' }}>{kpi.faqs_asked}</td>
                                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: score > 50 ? 'var(--brand-success)' : 'var(--brand-accent)' }}>{score}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* R&D PERFORMANCE TABLE */}
                        <h4 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "12px", display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '18px' }}>
                            <FiActivity /> R&D / Tech Resolution Matrix
                        </h4>
                        <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)', overflowX: 'auto', marginTop: '15px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-sidebar)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                        <th style={{ padding: '15px', color: 'var(--text-primary)' }}>Engineer Name</th>
                                        <th style={{ padding: '15px', color: 'var(--text-primary)' }}>Role</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)' }}>Technical FAQs<br/>Resolved</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)' }}>System Actions<br/>Tracked</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)' }}>Contribution Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rndKpis.map((kpi, idx) => {
                                        // R&D Score: FAQs Answered(x15) + General Actions(x0.5)
                                        const score = (parseInt(kpi.faqs_answered) * 15) + Math.floor(parseInt(kpi.actions_logged) * 0.5);
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '15px' }}>{kpi.name}</strong>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{kpi.email}</span>
                                                </td>
                                                <td style={{ padding: '15px', color: 'var(--text-primary)' }}>{kpi.role}</td>
                                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: 'var(--brand-success)' }}>{kpi.faqs_answered}</td>
                                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>{kpi.actions_logged}</td>
                                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: score > 30 ? 'var(--brand-success)' : 'var(--brand-accent)' }}>{score}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB: FINANCIALS --- */}
                {(activeTab === 'financial') && (
                    <div className="print-section">
                        <h4 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "12px", display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '18px' }}>
                            <FiMapPin /> Logistics Financial Exposure
                        </h4>
                        <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)', overflowX: 'auto', marginTop: '15px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-sidebar)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                        <th style={{ padding: '15px', color: 'var(--text-primary)' }}>Financial Period (Month)</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)' }}>Volume (Dispatches Logged)</th>
                                        <th style={{ padding: '15px', textAlign: 'right', color: 'var(--text-primary)' }}>Total Expenditure (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transportKpis.monthly_costs.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No dispatch records have been logged yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        transportKpis.monthly_costs.map((mc, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                    {new Date(`${mc.month_period}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <span style={{ background: 'var(--bg-main)', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
                                                        {mc.total_dispatches}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: 'var(--brand-danger)', fontSize: '15px' }}>
                                                    ₹ {Number(mc.total_cost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {/*GTM Chrt.JS*/}
                {activeTab === 'GTM' && (
                <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)', marginTop: '20px' }}>
                    <h4 style={{ margin: '0 0 15px 0' }}>GTM Source Evaluation (Last 90 Days)</h4>
                    <div style={{ height: '300px' }}>
                        <Bar data={gtmChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
               </div>
                )}
                {/*System analytics*/}
                {(activeTab === 'health') && (
                    <div className="print-section">
                        <h4 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-danger)' }}>
                            <FiAlertOctagon /> Engineering System Fault Logs
                        </h4>
                        <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)', overflowX: 'auto', marginTop: '15px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-sidebar)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                        <th style={{ padding: '12px 15px' }}>Timestamp</th>
                                        <th style={{ padding: '12px 15px' }}>API Route</th>
                                        <th style={{ padding: '12px 15px' }}>Exception Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {errorLogs.length === 0 ? (
                                        <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px', color: 'var(--brand-success)'}}>✅ 100% Uptime. No recent server errors.</td></tr>
                                    ) : (
                                        errorLogs.map((log, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }}>
                                                <td style={{ padding: '12px 15px', color: 'var(--text-muted)' }}>{log.created_at.split('.')[0].replace('T', ' ')}</td>
                                                <td style={{ padding: '12px 15px', fontFamily: 'monospace', fontWeight: 'bold' }}>{log.route_path}</td>
                                                <td style={{ padding: '12px 15px', color: 'var(--brand-danger)' }}>{log.error_message}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

`{(activeTab === 'gtm') && (
                    <div className="print-section">
                        <h4 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                            <FiTarget /> GTM Data Source ROI (Last 90 Days)
                        </h4>
                        <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)', overflowX: 'auto', marginTop: '15px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-sidebar)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                        <th style={{ padding: '12px 15px' }}>GTM Provider</th>
                                        <th style={{ padding: '12px 15px' }}>Month</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center' }}>Total Spend</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center' }}>Yield (Found/Queued)</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center' }}>Sent Email</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center' }}>Replies</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center' }}>Closed Deals</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gtmKpis.length === 0 ? (
                                        <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No GTM data logged yet.</td></tr>
                                    ) : (
                                        gtmKpis.map((kpi, idx) => {
                                            const yieldRate = kpi.targets_queued > 0 ? ((kpi.emails_found / kpi.targets_queued) * 100).toFixed(1) : 0;
                                            const closeRate = kpi.emails_sent > 0 ? ((kpi.deals_closed / kpi.emails_sent) * 100).toFixed(1) : 0;

                                            return (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                    <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{kpi.gtm_source}</td>
                                                    <td style={{ padding: '12px 15px' }}>{kpi.month}</td>
                                                    <td style={{ padding: '12px 15px', textAlign: 'center', color: 'var(--brand-danger)', fontWeight: 'bold' }}>${kpi.total_spend.toFixed(2)}</td>
                                                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>{kpi.emails_found} / {kpi.targets_queued} <br/><span style={{fontSize:'10px', color: 'var(--text-muted)'}}>({yieldRate}%)</span></td>
                                                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>{kpi.emails_sent}</td>
                                                    <td style={{ padding: '12px 15px', textAlign: 'center', color: 'var(--brand-accent)' }}>{kpi.replies_received}</td>
                                                    <td style={{ padding: '12px 15px', textAlign: 'center', color: 'var(--brand-success)', fontWeight: 'bold' }}>
                                                        {kpi.deals_closed} <br/><span style={{fontSize:'10px', color: 'var(--text-muted)'}}>({closeRate}% Win)</span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}`