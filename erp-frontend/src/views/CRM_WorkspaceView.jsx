import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CRM_WorkspaceView({ state }) {
    const {
        loadLeads,
        handleStatusChange,
        leads,
        loading,
    } = state;

    // Helper to format the WPForms product query list into tags
    const renderProductTags = (queryStr) => {
        if (!queryStr) {
            return (
                <span className="text-xs text-[var(--text-muted)]">
                    No specific product
                </span>
            );
        }

        const products = queryStr
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);

        return (
            <div className="flex flex-wrap gap-1.5">
                {products.map((prod, i) => (
                    <Badge
                        key={i}
                        variant="outline"
                        className="border-[var(--border-light)] bg-[var(--bg-muted)] text-xs font-normal text-[var(--brand-accent)]"
                    >
                        {prod}
                    </Badge>
                ))}
            </div>
        );
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "New":
                return (
                    <Badge className="bg-[var(--brand-danger)] text-white hover:bg-[var(--brand-danger)]">
                        New
                    </Badge>
                );

            case "Contacted":
                return (
                    <Badge className="bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)]">
                        Contacted
                    </Badge>
                );

            case "Lost":
                return (
                    <Badge className="border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]">
                        Lost
                    </Badge>
                );

            case "Converted":
                return (
                    <Badge className="bg-[var(--brand-success)] text-white hover:bg-[var(--brand-success)]">
                        Converted
                    </Badge>
                );

            default:
                return (
                    <Badge
                        variant="outline"
                        className="border-[var(--border-light)] text-[var(--text-muted)]"
                    >
                        {status}
                    </Badge>
                );
        }
    };

    return (
        <Card className="overflow-hidden border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-[var(--border-light)] bg-[var(--bg-surface)]">
                <div className="space-y-1">
                    <CardTitle className="text-xl text-[var(--text-primary)]">
                        🎯 B2B Sales Pipeline
                    </CardTitle>

                    <p className="text-sm text-[var(--text-muted)]">
                        Direct GoDaddy Website Feed
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={loadLeads}
                    disabled={loading}
                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                >
                    {loading ? "Syncing..." : "↻ Refresh Pipeline"}
                </Button>
            </CardHeader>

            <CardContent className="bg-[var(--bg-main)] p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-[var(--bg-muted)]">
                            <TableRow className="border-[var(--border-light)] hover:bg-[var(--bg-muted)]">
                                <TableHead className="w-[100px] text-[var(--text-muted)]">
                                    Date
                                </TableHead>

                                <TableHead className="min-w-[260px] text-[var(--text-muted)]">
                                    Prospect Entity
                                </TableHead>

                                <TableHead className="min-w-[220px] text-[var(--text-muted)]">
                                    Contact & Region
                                </TableHead>

                                <TableHead className="min-w-[260px] text-[var(--text-muted)]">
                                    Expressed Interest
                                </TableHead>

                                <TableHead className="w-[120px] text-[var(--text-muted)]">
                                    Status
                                </TableHead>

                                <TableHead className="w-[160px] text-right text-[var(--text-muted)]">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {leads.length === 0 && !loading ? (
                                <TableRow className="border-[var(--border-light)]">
                                    <TableCell
                                        colSpan={6}
                                        className="h-32 text-center text-[var(--text-muted)]"
                                    >
                                        No pending inquiries in your
                                        territory.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leads.map((lead) => (
                                    <TableRow
                                        key={lead.id}
                                        className="border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                                    >
                                        {/* Date */}
                                        <TableCell className="align-top text-xs text-[var(--text-muted)]">
                                            {new Date(
                                                lead.created_at
                                            ).toLocaleDateString()}
                                        </TableCell>

                                        {/* Prospect Entity */}
                                        <TableCell className="align-top">
                                            <div className="font-semibold text-[var(--text-primary)]">
                                                {lead.company_name ||
                                                    "Unknown Company"}
                                            </div>

                                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                <span className="text-sm text-[var(--text-primary)]">
                                                    {lead.full_name}
                                                </span>

                                                {lead.designation && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="border border-[var(--border-light)] bg-[var(--bg-muted)] text-[10px] text-[var(--text-muted)]"
                                                    >
                                                        {lead.designation}
                                                    </Badge>
                                                )}
                                            </div>

                                            {lead.gdpr_consent && (
                                                <div className="mt-1 text-[10px] font-medium text-[var(--brand-success)]">
                                                    ✓ GDPR Consented
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Contact & Location */}
                                        <TableCell className="align-top">
                                            <div className="text-sm font-medium text-[var(--text-primary)]">
                                                {lead.city_state}
                                            </div>

                                            <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                                                Zone: {lead.assigned_region}
                                            </div>

                                            <div className="mt-1 text-xs text-[var(--brand-accent)]">
                                                ✉ {lead.contact_email}
                                            </div>

                                            <div className="text-xs text-[var(--text-muted)]">
                                                📞 {lead.phone_number}
                                            </div>
                                        </TableCell>

                                        {/* Interest */}
                                        <TableCell className="align-top">
                                            {renderProductTags(
                                                lead.product_query
                                            )}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="align-top">
                                            {getStatusBadge(lead.status)}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="align-top text-right">
                                            <div className="flex flex-col items-end gap-1.5">
                                                {lead.status === "New" && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                lead.id,
                                                                "Contacted"
                                                            )
                                                        }
                                                    >
                                                        Mark Contacted
                                                    </Button>
                                                )}

                                                {lead.status === "Contacted" && (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="w-full bg-[var(--brand-success)] text-white hover:bg-[var(--brand-success)] hover:opacity-90"
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    lead.id,
                                                                    "Converted"
                                                                )
                                                            }
                                                        >
                                                            Convert to Client
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full text-[var(--text-muted)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    lead.id,
                                                                    "Lost"
                                                                )
                                                            }
                                                        >
                                                            Close / Lost
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}