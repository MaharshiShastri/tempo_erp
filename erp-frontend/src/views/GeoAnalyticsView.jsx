import GeoMapCanvas from "../components/geo/GeoMapCanvas";

export default function GeoAnalyticsView({state}){
    return (
        <div className="frappe-card">
            <GeoMapCanvas state={state}/>
        </div>
    )
}