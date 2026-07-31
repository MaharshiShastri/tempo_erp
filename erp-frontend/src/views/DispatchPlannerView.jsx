import useTruckCanvas from "../hooks/dispatch/useTruckVisualizer";
import {FiTruck } from "react-icons/fi";

export default function DispatchPlannerView({state}){
    const canvasRef = useTruckCanvas(state.packedBoxes, state.truckDim);

    return(
        <div className="frappe-card">
            <div style={{ flex: 1, minWidth: '400px', background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-light)", display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                    <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><FiTruck /> Dynamic Truck Spatial Visualizer</h4>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div><label className="input-label">Truck Length (inches)</label><input type="number" className="form-input" value={state.truckDim.length || ''} onChange={e => state.setTruckDim({...state.truckDim, length: +e.target.value || 0})} /></div>
                        <div><label className="input-label">Truck Width (inches)</label><input type="number" className="form-input" value={state.truckDim.width || ''} onChange={e => state.setTruckDim({...state.truckDim, width: +e.target.value || 0})} /></div>
                    </div>
                </div>
            </div>
        
            {/* Custom Auto-Scaling Canvas */}
            <div style={{ flex: 1, minHeight: '350px', background: '#e2e8f0', position: 'relative' }}>
                <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
            </div>

            {state.packedBoxes.boxes.some(b => !b.fits) && (
                <div style={{ background: 'var(--brand-danger)', color: '#fff', padding: '10px 20px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>⚠️ OVERFLOW ALERT: Cargo layout exceeds available footprint dimensions!</div>
            )}
               
        </div>
    );
}