import {Plus, Pencil, Trash2, FileDown, RefreshCw, Package, ClipboardList} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";

export default function BOMListView({state}){
    const {bomList, isLoadingBOMs, refreshBOMList, deleteBOM, generateBOMPdf, onEdit, onCreate} = state;

    const handleDelete = async(bom) => {
        const confirmed = window.confirm(`Delete BOM "${bom.bom_name || bom.item_code}"?`);
        if(!confirmed) return;
        await deleteBOM(bom.id);
    };

    const getStatusBadge = (status) => {
        switch(status){
            case "Active":
                return (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
                );

            case "Obsolete":
                return(
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Obsolete</Badge>
                );

            default:
                return (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Draft</Badge>
                )
        }
    };

    return(
        <div className="mx-auto w-full max-w-[1500px] space-y-6">
            <Card className="overflow-hidden border-0 shadow-sm">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-3">

                                <div className="rounded-xl bg-white/15 p-2.5">
                                <ClipboardList className="h-6 w-6"/>
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold">Bill of Materials</h1>

                                    <p className="text-sm text-blue-100">
                                        Manage production BOM, revisions and purchase copies.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button onClick={onCreate} className="bg-white text-blue-700 hover:bg-blue-50">
                            <Plus className="h-6 w-6"/>
                            Create New BOM
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-slate-50-70">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:jusify-between">
                        <div>
                            <CardTitle>
                                BOM Register
                            </CardTitle>

                            <CardDescription>
                                {bomList.length} Bills of Material registered
                            </CardDescription>
                        </div>

                        <Button variant="outline" size="sm" onClick={refreshBOMList} disabled={isLoadingBOMs}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingBOMs ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                
                <CardContent className="p-0">
                    {isLoadingBOMs ? (
                        <div className="flex h-48 items-center justify-center">
                            <RefreshCw className="h-6 w-6 animate-spin text-blue-600"/>
                        </div>
                        ) : bomList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                                <div className="mb-4 rounded-2xl bg-blue-50 p-4">
                                    <Package className="h-10 w-10 text-blue-600"/>
                                </div>

                                <h3 className="text-lg font-semibold">
                                    No BOMs yet.
                                </h3>

                                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                    Create your first Bill of Materials to define the raw
                                    materials required for production.
                                </p>

                                <Button className="mt-5" onClick={onCreate}>
                                    <Plus className="mr-2 h-4 w-4"/>
                                    Create New BOM
                                </Button>
                            </div>
                        ): (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableHead>Product</TableHead>
                                            <TableHead>BOM Name</TableHead>
                                            <TableHead>Revision</TableHead>
                                            <TableHead>Output</TableHead>
                                            <TableHead>Components</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {bomList.map((item)=>(
                                            <TableRow className="group transition-colors hover:bg-blue-50/50" key={item.id}>
                                                
                                                <TableCell>
                                                    <div className="font-semibold text-[var(--text-primary)]-800">{item.item_code}</div>
                                                </TableCell>
                                                
                                                <TableCell>
                                                    <div className="font-medium">{item.bom_name || "Unnamed BOM"}</div>
                                                </TableCell>

                                                <TableCell>
                                                    <Badge variant="outline">
                                                        Rev {item.revision_no}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell>
                                                    {item.output_quantity}{" "}{item.uom}
                                                </TableCell>

                                                <TableCell>
                                                    {item.components?.length ?? "-"}
                                                </TableCell>

                                                <TableCell>
                                                    {getStatusBadge(item.status)}
                                                </TableCell>

                                                <TableCell>
                                                    {item.effective_from ? new Date(item.effective_from).toLocaleDateString("en-IN") : "-"}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="default" size="icon" title="Edit BOM"
                                                        className="text-blue-600 hover:bg-blue-100 hover:text-blue-700" onClick={() => onEdit?.(item.id)}>
                                                            <Pencil className="h-4 w-4"/>
                                                        </Button>

                                                        <Button variant="ghost" size="icon" title="Get Purchase Copy"
                                                        className="text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700" onClick={() => generateBOMPdf(item.id)}>
                                                            <FileDown className="h-4 w-4"/>
                                                        </Button>

                                                        <Button variant="destructive" size="icon" title="Delete BOM"
                                                        className="text-red-600 hover:bg-red-100 hover:text-red-700" onClick={()=>handleDelete(item)}>
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                </CardContent>
            </Card>
        </div>
    );
}