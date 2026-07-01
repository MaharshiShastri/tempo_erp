import React, { useState, useEffect } from "react";
import API from "../api/api";
import { FiTarget, FiAward, FiAlertCircle } from "react-icons/fi";

export default function PersonalSalesAnalyticsView({ state }) {
    const [myData, setMyData] = useState(null);

    useEffect(() => {
        const fetchPersonalData = async () => {
            try {
                // Fetch the global array, but filter for the logged-in user
                const data = await API.fetchSalesKPIs(state.user.access_token);
                const me = data.find(k => k.email === state.user.email);
                setMyData(me);
            } catch (err) { state.showErrorModal("Error", err.message); }
        };
        fetchPersonalData();
    }, []);

    if (!myData) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your personal scorecard...</div>;

    const target = parseInt(myData.monthly_lead_target || 0);
    const harvested = parseInt(myData.targets_harvested || 0);
    const shortfall = Math.max(0, target - harvested);
    const progressPercentage = target > 0 ? Math.min(100, (harvested / target) * 100) : 0;

    return (
        <div className="frappe-card" style={{ maxWidth: 800, margin: "0 auto", padding: 30 }}>
            <div className="system-header" style={{ marginBottom: "30px" }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FiTarget /> My Monthly Quota & Shortfall</h2>
                <p style={{ color: 'var(--text-muted)' }}>Track your Lead Generation pipeline progress.</p>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '30px', borderRadius: '8px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px' }}>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Monthly Target</div>
                        <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{target}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Harvested (Won)</div>
                        <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--brand-success)' }}>{harvested}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Current Shortfall</div>
                        <div style={{ fontSize: '36px', fontWeight: 'bold', color: shortfall > 0 ? 'var(--brand-danger)' : 'var(--brand-success)' }}>
                            {shortfall}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ background: 'var(--bg-surface)', height: '20px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ 
                        height: '100%', 
                        width: `${progressPercentage}%`, 
                        background: progressPercentage >= 100 ? 'var(--brand-success)' : 'var(--brand-accent)',
                        transition: 'width 1s ease-in-out'
                    }} />
                </div>
                
                <div style={{ marginTop: '15px', fontSize: '14px', fontWeight: 'bold', color: progressPercentage >= 100 ? 'var(--brand-success)' : 'var(--text-primary)' }}>
                    {progressPercentage >= 100 ? <><FiAward /> Target Achieved! Excellent work.</> : <><FiAlertCircle /> You are {progressPercentage.toFixed(1)}% to goal.</>}
                </div>

            </div>
        </div>
    );
}