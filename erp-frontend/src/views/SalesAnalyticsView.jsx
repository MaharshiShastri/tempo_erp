import React, { useState, useEffect, useRef } from "react";
import API from "../api/api";
import { FiTrendingUp, FiActivity, FiTruck, FiDownload, FiPieChart, FiMapPin, FiUsers } from "react-icons/fi";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function SalesAnalyticsView({ state }) {
    const [salesKpis, setSalesKpis] = useState([]);
    const [transportKpis, setTransportKpis] = useState({ total_partners: 0, monthly_costs: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [isExporting, setIsExporting] = useState(false);
    
    // Reference to the main dashboard container for the PDF snapshot
    const dashboardRef = useRef(null);

    useEffect(() => {
        const fetchAllKPIs = async () => {
            try {
                const [salesData, transportData] = await Promise.all([
                    API.fetchSalesKPIs(state.user.access_token),
                    API.fetchTransportKPIs(state.user.access_token)
                ]);
                setSalesKpis(salesData);
                setTransportKpis(transportData);
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
            
            // Capture the DOM element as a high-res canvas
            const canvas = await html2canvas(element, {
                scale: 2, // 2x scale for crisp text
                useCORS: true,
                logging: false,
                backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1b1b29' : '#ffffff' 
            });

            const imgData = canvas.toDataURL('image/png');
            
            // A4 Document settings
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            // Handle Multi-Page PDFs if the dashboard is long
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

    if (isLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Command Center Data...</div>;
    }

    // Derived Metrics for the Dashboard
    const totalQueued = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.targets_queued || 0), 0);
    const totalHarvested = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.targets_harvested || 0), 0);
    const conversionRatio = totalQueued > 0 ? ((totalHarvested / totalQueued) * 100).toFixed(1) : 0;
    const totalCrmLeads = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.total_crm_leads || 0), 0);

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            
            {/* Action Bar (Not included in PDF) */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
                <button 
                    className="btn btn-primary" 
                    onClick={handleExportPDF} 
                    disabled={isExporting}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                >
                    <FiDownload /> {isExporting ? "Generating PDF..." : "Export to PDF"}
                </button>
            </div>

            {/* THIS IS THE AREA THAT WILL BE CONVERTED TO PDF */}
            <div ref={dashboardRef} className="frappe-card" style={{ padding: 30, borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-main)' }}>
                
                {/* Header */}
                <div style={{ marginBottom: "30px", borderBottom: "1px solid var(--border-light)", paddingBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px' }}>
                            <FiPieChart /> Executive Command Center
                        </h2>
                        <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Financial data, regional exposure, and team performance
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <strong>Generated:</strong> {new Date().toLocaleString()}
                    </div>
                </div>

                {/* Dashboard Tabs (Visually distinct for the report) */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }} data-html2canvas-ignore="true">
                    <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('overview')}>General Overview</button>
                    <button className={`btn ${activeTab === 'performance' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('performance')}><FiUsers /> Team Performance</button>
                    <button className={`btn ${activeTab === 'financial' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('financial')}><FiTruck /> Logistics & Financials</button>
                </div>

                {/* --- TAB: OVERVIEW --- */}
                {(activeTab === 'overview') && (
                    <div className="form-grid-layout" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '30px' }}>
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
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Active CRM Deal Pipeline</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--brand-success)' }}>{totalCrmLeads}</div>
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '25px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Active Carrier Network</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--brand-accent)' }}>{transportKpis.total_partners}</div>
                        </div>
                    </div>
                )}

                {/* --- TAB: TEAM PERFORMANCE --- */}
                {(activeTab === 'performance') && (
                    <div style={{ marginBottom: "40px" }}>
                        <h4 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "12px", display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '18px' }}>
                            <FiActivity /> Sales Force Activity Matrix
                        </h4>
                        <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)', overflowX: 'auto', marginTop: '15px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-sidebar)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                        <th style={{ padding: '15px' }}>Executive Name</th>
                                        <th style={{ padding: '15px', textAlign: 'center' }}>Target Generation<br/>(Queued / Harvested)</th>
                                        <th style={{ padding: '15px', textAlign: 'center' }}>Inactive<br/>Targets</th>
                                        <th style={{ padding: '15px', textAlign: 'center' }}>Active Deals<br/>(CRM)</th>
                                        <th style={{ padding: '15px', textAlign: 'center' }}>Dispatches<br/>Processed</th>
                                        <th style={{ padding: '15px', textAlign: 'center' }}>Activity Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesKpis.map((kpi, idx) => {
                                        const score = (parseInt(kpi.targets_queued) * 2) + (parseInt(kpi.total_crm_leads) * 5) + (parseInt(kpi.dispatches_logged) * 10);
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '15px' }}>{kpi.name}</strong>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{kpi.email}</span>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center', color: 'var(--text-primary)' }}>
                                                    {kpi.targets_queued} / <span style={{ color: 'var(--brand-success)', fontWeight: 'bold' }}>{kpi.targets_harvested}</span>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>{kpi.targets_inactive}</td>
                                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>{kpi.total_crm_leads}</td>
                                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>{kpi.dispatches_logged}</td>
                                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: score > 50 ? 'var(--brand-success)' : 'var(--brand-accent)' }}>{score}</td>
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
                    <div>
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
            </div>
        </div>
    );
}