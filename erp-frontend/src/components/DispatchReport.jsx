import React from "react";

const money = (value) => {
    const num = Number(value) || 0;
    return `₹${num.toFixed(2)}`;
};

const DispatchReport = React.forwardRef(({ state }, ref) => {
    if (!state.resultsData?.options?.length) {
        return null;
    }

    const options = state.resultsData.options;

    const sortedOptions = [...options].sort(
        (a, b) =>
            Number(a.dispatch_cost_gst || 0) -
            Number(b.dispatch_cost_gst || 0)
    );

    const cheapest = sortedOptions[0];

    /*
     * Calculate the actual volume from the values entered by the user.
     *
     * This is intentionally NOT using the backend's "1 x 1 x total"
     * trick. The report should show the real package dimensions.
     */
    const totalVolume = state.products.reduce((total, product) => {
        const width = Number(product.width) || 0;
        const depth = Number(product.depth) || 0;
        const height = Number(product.height) || 0;

        return total + width * depth * height;
    }, 0);

    return (
        <div
            ref={ref}
            id="dispatch-print-sheet"
            style={{
                width: "794px",
                height: "1123px",
                boxSizing: "border-box",
                background: "#ffffff",
                color: "#222222",
                fontFamily: "Arial, Helvetica, sans-serif",
                padding: "28px 30px",
                overflow: "hidden",
                fontSize: "10px",
                lineHeight: "1.25",
            }}
        >
            {/* HEADER */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    borderBottom: "2px solid #222",
                    paddingBottom: "10px",
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "22px",
                            fontWeight: 700,
                        }}
                    >
                        Tempo Instruments ERP
                    </h1>

                    <h2
                        style={{
                            margin: "4px 0 0",
                            fontSize: "14px",
                            fontWeight: 600,
                        }}
                    >
                        Dispatch Cost Evaluation Report
                    </h2>
                </div>

                <div
                    style={{
                        textAlign: "right",
                        fontSize: "9px",
                        color: "#555",
                    }}
                >
                    <div>
                        Generated: {new Date().toLocaleDateString()}
                    </div>
                    <div>
                        Time: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* SHIPMENT SUMMARY */}
            <ReportSection title="Shipment Summary">
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "7px",
                    }}
                >
                    <SummaryCard
                        label="Destination"
                        value={state.dim.destination_city || "-"}
                    />

                    <SummaryCard
                        label="Invoice Value"
                        value={money(state.dim.invoice_value)}
                    />

                    <SummaryCard
                        label="Weight"
                        value={`${state.dim.weight || 0} KG`}
                    />

                    <SummaryCard
                        label="Packages"
                        value={state.products.length}
                    />

                    <SummaryCard
                        label="Total Volume"
                        value={`${totalVolume.toFixed(2)} ${state.unit}³`}
                    />

                    <SummaryCard
                        label="Loading"
                        value={
                            state.dim.loading_type === "hub"
                                ? "Hub"
                                : "Local"
                        }
                    />

                    <SummaryCard
                        label="Delivery"
                        value={
                            state.dim.delivery_type === "godown"
                                ? "Godown Hub"
                                : "Door"
                        }
                    />

                    <SummaryCard
                        label="Hamali"
                        value={money(state.dim.hamali_cost)}
                    />
                </div>
            </ReportSection>

            {/* PACKAGE DETAILS */}
            <ReportSection title="Package Details">
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <Th>#</Th>
                            <Th>Width</Th>
                            <Th>Depth</Th>
                            <Th>Height</Th>
                            <Th>Unit</Th>
                            <Th>Volume</Th>
                        </tr>
                    </thead>

                    <tbody>
                        {state.products.map((product, index) => {
                            const volume =
                                (Number(product.width) || 0) *
                                (Number(product.depth) || 0) *
                                (Number(product.height) || 0);

                            return (
                                <tr key={index}>
                                    <Td center>{index + 1}</Td>
                                    <Td>{product.width || 0}</Td>
                                    <Td>{product.depth || 0}</Td>
                                    <Td>{product.height || 0}</Td>
                                    <Td center>{state.unit}</Td>
                                    <Td>{volume.toFixed(2)}</Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </ReportSection>

            {/* DISPATCH CONFIGURATION */}
            <ReportSection title="Dispatch Configuration">
                <table style={tableStyle}>
                    <tbody>
                        <tr>
                            <Td bold>Loading Type</Td>
                            <Td>
                                {state.dim.loading_type === "hub"
                                    ? "Hub"
                                    : "Local"}
                            </Td>

                            <Td bold>Delivery Type</Td>
                            <Td>
                                {state.dim.delivery_type === "godown"
                                    ? "Godown Hub"
                                    : "Door"}
                            </Td>
                        </tr>

                        <tr>
                            <Td bold>Hub Loading</Td>
                            <Td>
                                {state.dim.loading_type === "hub"
                                    ? money(state.dim.hub_loading_input)
                                    : "Local Fixed"}
                            </Td>

                            <Td bold>Extra Hamali</Td>
                            <Td>
                                {state.dim.hamali_detail || "-"}
                                {" — "}
                                {money(state.dim.hamali_cost)}
                            </Td>
                        </tr>
                    </tbody>
                </table>
            </ReportSection>

            {/* DISTANCE MAPPING */}
            {state.dim.delivery_type === "door" &&
                state.partners?.filter((p) => p.partner_link).length > 0 && (
                    <ReportSection title="Partner Distance Mapping">
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <Th>Partner</Th>
                                    <Th>Distance (KM)</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {state.partners
                                    .filter((p) => p.partner_link)
                                    .map((partner) => (
                                        <tr key={partner.id}>
                                            <Td>{partner.name}</Td>
                                            <Td>
                                                {state.partnerDistances[
                                                    partner.id
                                                ] || 0}
                                            </Td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </ReportSection>
                )}

            {/* TRANSPORT COMPARISON */}
            <ReportSection title="Transport Comparison">
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <Th>Rank</Th>
                            <Th>Transporter</Th>
                            <Th>Zone</Th>
                            <Th>Basic</Th>
                            <Th>Loading</Th>
                            <Th>Fuel</Th>
                            <Th>Doc.</Th>
                            <Th>FOV</Th>
                            <Th>ODA</Th>
                            <Th>Hamali</Th>
                            <Th>Total GST</Th>
                        </tr>
                    </thead>

                    <tbody>
                        {sortedOptions.map((opt, index) => {
                            const isCheapest = index === 0;

                            return (
                                <tr
                                    key={`${opt.partner_name}-${index}`}
                                    style={{
                                        background: isCheapest
                                            ? "#dff7df"
                                            : index % 2 === 1
                                            ? "#fafafa"
                                            : "#fff",
                                        fontWeight: isCheapest
                                            ? 700
                                            : 400,
                                    }}
                                >
                                    <Td center>
                                        {isCheapest ? "★" : index + 1}
                                    </Td>

                                    <Td>{opt.partner_name || "-"}</Td>

                                    <Td center>
                                        {opt.destination_zone || "-"}
                                    </Td>

                                    <Td right>
                                        {money(opt.basic_freight)}
                                    </Td>

                                    <Td right>
                                        {money(opt.loading_charge)}
                                    </Td>

                                    <Td right>
                                        {money(opt.fuel_charge)}
                                    </Td>

                                    <Td right>
                                        {money(opt.documentation_charge)}
                                    </Td>

                                    <Td right>
                                        {money(opt.fov_charge)}
                                    </Td>

                                    <Td right>
                                        {money(opt.oda_charge)}
                                    </Td>

                                    <Td right>
                                        {money(opt.hamali_cost)}
                                    </Td>

                                    <Td right>
                                        {money(opt.dispatch_cost_gst)}
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </ReportSection>

            {/* RECOMMENDED PARTNER */}
            <ReportSection title="Recommended Transport Partner">
                <table style={tableStyle}>
                    <tbody>
                        <tr>
                            <Td bold>Partner</Td>
                            <Td bold>
                                {cheapest.partner_name || "-"}
                            </Td>

                            <Td bold>Total Cost</Td>
                            <Td bold right>
                                {money(cheapest.dispatch_cost_gst)}
                            </Td>
                        </tr>

                        <tr>
                            <Td bold>Destination Zone</Td>
                            <Td>{cheapest.destination_zone || "-"}</Td>

                            <Td bold>State</Td>
                            <Td>{cheapest.state || "-"}</Td>
                        </tr>

                        <tr>
                            <Td bold>Chargeable Weight</Td>
                            <Td>
                                {cheapest.chargeable_weight || 0} KG
                            </Td>

                            <Td bold>Delivery</Td>
                            <Td>
                                {state.dim.delivery_type === "door"
                                    ? "Door"
                                    : "Godown Hub"}
                            </Td>
                        </tr>
                    </tbody>
                </table>
            </ReportSection>

            {/* DETAILED COST PER TRANSPORTER */}
            <ReportSection title="Detailed Cost Breakdown — All Transporters">
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <Th>Transporter</Th>
                            <Th>Basic</Th>
                            <Th>Loading</Th>
                            <Th>Fuel</Th>
                            <Th>Documentation</Th>
                            <Th>FOV</Th>
                            <Th>ODA</Th>
                            <Th>Hamali</Th>
                            <Th>Subtotal</Th>
                            <Th>GST Total</Th>
                        </tr>
                    </thead>

                    <tbody>
                        {sortedOptions.map((opt, index) => (
                            <tr
                                key={`detail-${opt.partner_name}-${index}`}
                                style={{
                                    background:
                                        index === 0 ? "#dff7df" : "#fff",
                                }}
                            >
                                <Td bold={index === 0}>
                                    {opt.partner_name || "-"}
                                </Td>

                                <Td right>
                                    {money(opt.basic_freight)}
                                </Td>

                                <Td right>
                                    {money(opt.loading_charge)}
                                </Td>

                                <Td right>
                                    {money(opt.fuel_charge)}
                                </Td>

                                <Td right>
                                    {money(opt.documentation_charge)}
                                </Td>

                                <Td right>
                                    {money(opt.fov_charge)}
                                </Td>

                                <Td right>
                                    {money(opt.oda_charge)}
                                </Td>

                                <Td right>
                                    {money(opt.hamali_cost)}
                                </Td>

                                <Td right>
                                    {money(opt.subtotal)}
                                </Td>

                                <Td right bold>
                                    {money(opt.dispatch_cost_gst)}
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ReportSection>

            {/* RECOMMENDED BREAKDOWN */}
            <ReportSection title="Recommended Partner Cost Breakdown">
                <table style={tableStyle}>
                    <tbody>
                        <CostRow
                            label="Basic Freight"
                            value={cheapest.basic_freight}
                        />

                        <CostRow
                            label="Loading Charge"
                            value={cheapest.loading_charge}
                        />

                        <CostRow
                            label="Fuel Charge"
                            value={cheapest.fuel_charge}
                        />

                        <CostRow
                            label="Documentation Charge"
                            value={cheapest.documentation_charge}
                        />

                        <CostRow
                            label="FOV Charge"
                            value={cheapest.fov_charge}
                        />

                        <CostRow
                            label="ODA Charge"
                            value={cheapest.oda_charge}
                        />

                        {Number(cheapest.hamali_cost) > 0 && (
                            <CostRow
                                label={
                                    cheapest.hamali_detail ||
                                    "Hamali Charges"
                                }
                                value={cheapest.hamali_cost}
                            />
                        )}

                        <CostRow
                            label="Subtotal(before GST)"
                            value={cheapest.subtotal}
                            bold
                        />

                        <tr
                            style={{
                                background: "#dff7df",
                                fontSize: "11px",
                            }}
                        >
                            <Td bold>Total Dispatch Cost(after GST)</Td>

                            <Td right bold>
                                {money(cheapest.dispatch_cost_gst)}
                            </Td>
                        </tr>
                    </tbody>
                </table>
            </ReportSection>

            {/* APPROVALS */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "25px",
                    paddingTop: "5px",
                }}
            >
                <Signature label={
                    <>
                    Prepared by - {state?.user?.name || "-"}
                    </>} />

                <Signature label="Approved By(Name, Sign & Date above please)" />
            </div>

            {/* FOOTER */}
            <div
                style={{
                    marginTop: "15px",
                    paddingTop: "7px",
                    borderTop: "1px solid #aaa",
                    textAlign: "center",
                    fontSize: "8px",
                    color: "#666",
                }}
            >
                Tempo Instruments ERP — Dispatch Cost Evaluation
            </div>
        </div>
    );
});

/* -------------------------------------------------------
   Small reusable components
------------------------------------------------------- */

function ReportSection({ title, children }) {
    return (
        <div
            style={{
                marginTop: "11px",
            }}
        >
            <h3
                style={{
                    margin: "0 0 5px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                }}
            >
                {title}
            </h3>

            {children}
        </div>
    );
}

function SummaryCard({ label, value }) {
    return (
        <div
            style={{
                border: "1px solid #888",
                padding: "6px",
                textAlign: "center",
                minHeight: "38px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    fontWeight: 700,
                    fontSize: "8px",
                    marginBottom: "3px",
                    color: "#555",
                }}
            >
                {label}
            </div>

            <div
                style={{
                    fontSize: "10px",
                }}
            >
                {value}
            </div>
        </div>
    );
}

function Th({ children }) {
    return (
        <th
            style={{
                border: "1px solid #666",
                padding: "4px 3px",
                fontSize: "8px",
                background: "#efefef",
                textAlign: "center",
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    bold = false,
    right = false,
    center = false,
}) {
    return (
        <td
            style={{
                border: "1px solid #777",
                padding: "4px 3px",
                fontSize: "8px",
                fontWeight: bold ? 700 : 400,
                textAlign: right
                    ? "right"
                    : center
                    ? "center"
                    : "left",
                verticalAlign: "middle",
            }}
        >
            {children}
        </td>
    );
}

function CostRow({ label, value, bold = false }) {
    return (
        <tr>
            <Td bold={bold}>{label}</Td>
            <Td right bold={bold}>
                {money(value)}
            </Td>
        </tr>
    );
}

function Signature({ label }) {
    return (
        <div
            style={{
                width: "180px",
                borderTop: "1px solid #222",
                textAlign: "center",
                paddingTop: "5px",
                fontSize: "9px",
            }}
        >
            {label}
        </div>
    );
}

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "auto",
};

export default DispatchReport;