import React, { useState, useEffect } from "react";
import API from "../api/api";
import { FiTrendingUp, FiActivity, FiTruck } from "react-icons/fi";

export default function SalesAnalyticsView({ state }) {
    const [salesKpis, setSalesKpis] = useState([]);
    const [transportKpis, setTransportKpis] = useState({ total_partners: 0, monthly_costs: [] });
    const [isLoading, setIsLoading] = useState(true);

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
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading KPI Data Streams...</div>;
    }

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            
            {/* --- SECTION 1: SALES KPIs --- */}
            <div className="frappe-card" style={{ padding: 25, marginBottom: '30px' }}>
                <div className="system-header" style={{ marginBottom: "20px" }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiTrendingUp /> Sales Performance Analytics
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        System-wide Key Performance Indicators for the Sales & Operations Team
                    </p>
                </div>

                <div className="form-grid-layout" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '30px' }}>
                    <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Teams Tracked</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{salesKpis.length}</div>
                    </div>
                    <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Lead Targets Queued</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--brand-accent)' }}>
                            {salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.targets_queued || 0), 0)}
                        </div>
                    </div>
                    <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Inbound CRM Leads Assigned</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--brand-success)' }}>
                            {salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.total_crm_leads || 0), 0)}
                        </div>
                    </div>
                    <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dispatches Logged</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {salesKpis.reduce((acc, kpi) => acc + parseInt(kpi.dispatches_logged || 0), 0)}
                        </div>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-main)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                <th style={{ padding: '12px 15px' }}>Executive Name</th>
                                <th style={{ padding: '12px 15px' }}>System Role</th>
                                <th style={{ padding: '12px 15px', textAlign: 'center' }}>Lead Targets<br/>(Queued / Harvested)</th>
                                <th style={{ padding: '12px 15px', textAlign: 'center' }}>Inactive<br/>Targets</th>
                                <th style={{ padding: '12px 15px', textAlign: 'center' }}>CRM Leads<br/>Assigned</th>
                                <th style={{ padding: '12px 15px', textAlign: 'center' }}>Logistics<br/>Dispatched</th>
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
                                        <td style={{ padding: '12px 15px' }}>
                                            <span style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
                                                {kpi.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                            {kpi.targets_queued} / <span style={{ color: 'var(--brand-success)' }}>{kpi.targets_harvested}</span>
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            {kpi.targets_inactive}
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-block', minWidth: '30px', padding: '4px', background: 'var(--bg-main)', borderRadius: '4px' }}>
                                                {kpi.total_crm_leads}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-block', minWidth: '30px', padding: '4px', background: 'var(--bg-main)', borderRadius: '4px' }}>
                                                {kpi.dispatches_logged}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: score > 50 ? 'var(--brand-success)' : 'var(--brand-accent)' }}>
                                            <FiActivity style={{ marginRight: '4px' }}/> {score}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- SECTION 2: TRANSPORT KPIs --- */}
            <div className="frappe-card" style={{ padding: 25 }}>
                <div className="system-header" style={{ marginBottom: "20px" }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiTruck /> Transport & Logistics Analytics
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        Monthly financial exposure and transporter registry scaling
                    </p>
                </div>

                <div className="form-grid-layout" style={{ gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                    
                    {/* Transport Stats Card */}
                    <div style={{ background: 'var(--bg-main)', padding: '30px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px' }}>Active Logistics Partners</div>
                        <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--brand-accent)' }}>
                            {transportKpis.total_partners}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>Registered in Master DB</div>
                    </div>

                    {/* Monthly Expenditure Table */}
                    <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)', overflowX: 'auto', maxHeight: '300px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-main)', textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                                    <th style={{ padding: '12px 15px' }}>Financial Period (Month)</th>
                                    <th style={{ padding: '12px 15px', textAlign: 'center' }}>Total Dispatches Logged</th>
                                    <th style={{ padding: '12px 15px', textAlign: 'right' }}>Total Evaluated Cost (₹)</th>
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
                                                {/* Convert YYYY-MM to readable text */}
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
            </div>
        </div>
    );
}