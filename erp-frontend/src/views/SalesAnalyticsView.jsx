import React, { useState, useEffect } from "react";
import API from "../api/api";
import { FiTrendingUp, FiActivity, FiTruck, FiPrinter, FiPieChart, FiMapPin, FiUsers } from "react-icons/fi";

export default function SalesAnalyticsView({ state }) {
    const [salesKpis, setSalesKpis] = useState([]);
    const [transportKpis, setTransportKpis] = useState({ total_partners: 0, monthly_costs: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

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

    if (isLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Command Center Data...</div>;
    }

    // Derived Metrics for the Dashboard
    const totalQueued = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.targets_queued || 0), 0);
    const totalHarvested = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.targets_harvested || 0), 0);
    const conversionRatio = totalQueued > 0 ? ((totalHarvested / totalQueued) * 100).toFixed(1) : 0;
    const totalCrmLeads = salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.total_crm_leads || 0), 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="dashboard-wrapper" style={{ maxWidth: 1200, margin: "0 auto" }}>
            
            {/* Print Isolation Styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .dashboard-wrapper, .dashboard-wrapper * { visibility: visible; }
                    .dashboard-wrapper { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: white;}
                    .no-print { display: none !important; }
                    .frappe-card { box-shadow: none !important; border: none !important; }
                    .print-header { text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 10px;}
                }
            `}</style>

            <div className="frappe-card" style={{ padding: 25, marginBottom: '30px' }}>
                <div className="system-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiPieChart /> Executive Command Center
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                            Financial data, regional exposure, and team performance
                        </p>
                    </div>
                    <button className="btn btn-primary no-print" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiPrinter /> Export Report / PDF
                    </button>
                </div>

                <div className="no-print" style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
                    <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('overview')}>General Overview</button>
                    <button className={`btn ${activeTab === 'performance' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('performance')}><FiUsers /> Team Performance</button>
                    <button className={`btn ${activeTab === 'financial' ? 'btn-primary' : 'btn-text'}`} onClick={() => setActiveTab('financial')}><FiTruck /> Logistics & Financials</button>
                </div>

                {/* Print Only Header */}
                <div style={{ display: "none" }} className="print-header">
                    TEMPO INSTRUMENTS - EXECUTIVE ANALYTICS REPORT<br/>
                    <span style={{ fontSize: "12px", fontWeight: "normal" }}>Generated: {new Date().toLocaleString()}</span>
                </div>

                {/* --- TAB: OVERVIEW --- */}
                {(activeTab === 'overview' || window.matchMedia("print").matches) && (
                    <div className="form-grid-layout" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '30px' }}>
                        <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Lead Targets Queued</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalQueued}</div>
                        </div>
                        <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lead-to-Contact Harvest Ratio</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: conversionRatio > 50 ? 'var(--brand-success)' : 'var(--brand-accent)' }}>
                                {conversionRatio}%
                            </div>
                        </div>
                        <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active CRM Deal Pipeline</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--brand-success)' }}>{totalCrmLeads}</div>
                        </div>
                        <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Carrier Network</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--brand-accent)' }}>{transportKpis.total_partners}</div>
                        </div>
                    </div>
                )}

                {/* --- TAB: TEAM PERFORMANCE --- */}
                {(activeTab === 'performance' || window.matchMedia("print").matches) && (
                    <div style={{ marginBottom: "40px" }}>
                        <h4 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiActivity /> Sales Force Activity Matrix
                        </h4>
                        <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-main)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                        <th style={{ padding: '12px 15px' }}>Executive Name</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center' }}>Target Generation<br/>(Queued / Harvested)</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center' }}>Deactivated<br/>Targets</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center' }}>Active Deals<br/>(CRM)</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center' }}>Dispatches<br/>Processed</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center' }}>Activity Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesKpis.map((kpi, idx) => {
                                        const score = (parseInt(kpi.targets_queued) * 2) + (parseInt(kpi.total_crm_leads) * 5) + (parseInt(kpi.dispatches_logged) * 10);
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '12px 15px' }}>
                                                    <strong>{kpi.name}</strong>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{kpi.email}</div>
                                                </td>
                                                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                                    {kpi.targets_queued} / <span style={{ color: 'var(--brand-success)' }}>{kpi.targets_harvested}</span>
                                                </td>
                                                <td style={{ padding: '12px 15px', textAlign: 'center', color: 'var(--text-muted)' }}>{kpi.targets_inactive}</td>
                                                <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold' }}>{kpi.total_crm_leads}</td>
                                                <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold' }}>{kpi.dispatches_logged}</td>
                                                <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: score > 50 ? 'var(--brand-success)' : 'var(--brand-accent)' }}>{score}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB: FINANCIALS --- */}
                {(activeTab === 'financial' || window.matchMedia("print").matches) && (
                    <div>
                        <h4 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiMapPin /> Logistics Financial Exposure
                        </h4>
                        <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)', overflowX: 'auto', maxHeight: '400px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-main)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                        <th style={{ padding: '12px 15px' }}>Financial Period (Month)</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center' }}>Volume (Dispatches Logged)</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'right' }}>Total Expenditure (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transportKpis.monthly_costs.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No dispatch records have been logged yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        transportKpis.monthly_costs.map((mc, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>
                                                    {new Date(`${mc.month_period}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                </td>
                                                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                                    <span style={{ background: 'var(--bg-main)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                                        {mc.total_dispatches}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 'bold', color: 'var(--brand-danger)' }}>
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