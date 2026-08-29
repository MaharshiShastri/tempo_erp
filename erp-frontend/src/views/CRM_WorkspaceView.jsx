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
                <span className="text-xs text-muted-foreground">
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
                        className="font-normal text-xs text-primary"
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
                    <Badge variant="destructive">
                        New
                    </Badge>
                );

            case "Contacted":
                return (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                        Contacted
                    </Badge>
                );

            case "Lost":
                return (
                    <Badge variant="secondary">
                        Lost
                    </Badge>
                );

            case "Converted":
                return (
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                        Converted
                    </Badge>
                );

            default:
                return (
                    <Badge variant="outline">
                        {status}
                    </Badge>
                );
        }
    };

    return (
        <Card>
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b">
                <div className="space-y-1">
                    <CardTitle className="text-xl">
                        🎯 B2B Sales Pipeline
                    </CardTitle>

                    <p className="text-sm text-muted-foreground">
                        Direct GoDaddy Website Feed
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={loadLeads}
                    disabled={loading}
                >
                    {loading ? "Syncing..." : "↻ Refresh Pipeline"}
                </Button>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">
                                    Date
                                </TableHead>

                                <TableHead className="min-w-[260px]">
                                    Prospect Entity
                                </TableHead>

                                <TableHead className="min-w-[220px]">
                                    Contact & Region
                                </TableHead>

                                <TableHead className="min-w-[260px]">
                                    Expressed Interest
                                </TableHead>

                                <TableHead className="w-[120px]">
                                    Status
                                </TableHead>

                                <TableHead className="w-[160px] text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {leads.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        No pending inquiries in your territory.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        {/* Date */}
                                        <TableCell className="align-top text-xs text-muted-foreground">
                                            {new Date(
                                                lead.created_at
                                            ).toLocaleDateString()}
                                        </TableCell>

                                        {/* Prospect Entity */}
                                        <TableCell className="align-top">
                                            <div className="font-semibold text-foreground">
                                                {lead.company_name ||
                                                    "Unknown Company"}
                                            </div>

                                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                <span className="text-sm text-foreground">
                                                    {lead.full_name}
                                                </span>

                                                {lead.designation && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px]"
                                                    >
                                                        {lead.designation}
                                                    </Badge>
                                                )}
                                            </div>

                                            {lead.gdpr_consent && (
                                                <div className="mt-1 text-[10px] font-medium text-emerald-600">
                                                    ✓ GDPR Consented
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Contact & Location */}
                                        <TableCell className="align-top">
                                            <div className="font-medium text-sm">
                                                {lead.city_state}
                                            </div>

                                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                Zone: {lead.assigned_region}
                                            </div>

                                            <div className="mt-1 text-xs text-primary">
                                                ✉ {lead.contact_email}
                                            </div>

                                            <div className="text-xs text-muted-foreground">
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
                                                        className="w-full"
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
                                                            className="w-full bg-emerald-600 hover:bg-emerald-700"
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
                                                            className="w-full text-muted-foreground"
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