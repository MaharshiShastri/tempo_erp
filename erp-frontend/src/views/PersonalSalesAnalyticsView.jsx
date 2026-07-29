import React, { useState, useEffect } from "react";
import API from "../api/api";
import { FiTarget, FiAward, FiAlertCircle, FiTrendingUp, FiActivity } from "react-icons/fi";

export default function PersonalSalesAnalyticsView({ state }) {
    const {target, harvested, progressPercentage, shortfall, leaderboardByAmount, leaderboardByPercent,
        getPercent, user,
    } = state;
    return (
        <div className="frappe-card" style={{ maxWidth: 1100, margin: "0 auto", padding: 30 }}>
            {user.role === "Sales Representative" && (<>
            {/* 1. PERSONAL METRICS */}
            <div className="system-header" style={{ marginBottom: "20px" }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}><FiTarget /> My Quarterly Quota</h2>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Track your personal progress against your quarterly goal.</p>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '30px', borderRadius: '8px', border: '1px solid var(--border-light)', textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px' }}>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>QTR Target Value</div>
                        <div style={{ fontSize: '36px', fontWeight: 'bold' }}>₹{target.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Achieved (Won)</div>
                        <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--brand-success)' }}>₹{harvested.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Current Shortfall</div>
                        <div style={{ fontSize: '36px', fontWeight: 'bold', color: shortfall > 0 ? 'var(--brand-danger)' : 'var(--brand-success)' }}>
                            ₹{shortfall.toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', height: '20px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ 
                        height: '100%', width: `${progressPercentage}%`, 
                        background: progressPercentage >= 100 ? 'var(--brand-success)' : 'var(--brand-accent)',
                        transition: 'width 1s ease-in-out'
                    }} />
                </div>
                <div style={{ marginTop: '15px', fontSize: '14px', fontWeight: 'bold', color: progressPercentage >= 100 ? 'var(--brand-success)' : 'var(--text-primary)' }}>
                    {progressPercentage >= 100 ? <><FiAward /> Target Achieved! Excellent work.</> : <><FiAlertCircle /> You are {progressPercentage.toFixed(1)}% to goal.</>}
                </div>
            </div>
            </>)}
            {/* 2. COMPETITIVE LEADERBOARDS */}
            <div className="system-header" style={{ marginBottom: "20px" }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}><FiAward /> Team Leaderboards</h2>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>See how you rank against the rest of the sales force.</p>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* Board A: By Volume */}
                <div style={{ flex: 1, minWidth: '350px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-surface)', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--bg-sidebar)', padding: '15px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                        <FiActivity color="var(--brand-accent)" /> Top Closers (By Total Value)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <tbody>
                            {leaderboardByAmount.map((kpi, idx) => (
                                <tr key={idx} style={{ 
                                    borderBottom: '1px solid var(--border-subtle)', 
                                    background: kpi.email === user.email ? '#e0e7ff' : 'transparent' // Highlight logged-in user
                                }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: idx < 3 ? 'var(--brand-accent)' : 'inherit' }}>
                                        {idx + 1}. {kpi.name.split(' ')[0]}
                                        {kpi.email === user.email && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#4f46e5' }}>(You)</span>}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--brand-success)' }}>
                                        ₹{parseFloat(kpi.targets_harvested || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Board B: By Percentage */}
                <div style={{ flex: 1, minWidth: '350px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-surface)', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--bg-sidebar)', padding: '15px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                        <FiTrendingUp color="var(--brand-success)" /> Target Crushers (By Quota %)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <tbody>
                            {leaderboardByPercent.map((kpi, idx) => {
                                const pct = getPercent(kpi);
                                return (
                                    <tr key={idx} style={{ 
                                        borderBottom: '1px solid var(--border-subtle)', 
                                        background: kpi.email === user.email ? '#e0e7ff' : 'transparent' 
                                    }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: idx < 3 ? 'var(--brand-accent)' : 'inherit' }}>
                                            {idx + 1}. {kpi.name.split(' ')[0]}
                                        </td>
                                        <td style={{ padding: '12px', width: '40%' }}>
                                            <div style={{ background: 'var(--bg-success)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: pct >= 100 ? 'var(--brand-success)' : 'var(--brand-accent)' }} />
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: "var(--brand-success)" }}>
                                            {pct.toFixed(1)}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}