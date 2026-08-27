import { useState, useRef } from "react";

import {
    Upload,
    FileSpreadsheet,
    FileCheck2,
    Info,
    X,
    Loader2,
    Database,
} from "lucide-react";

import API from "../api/api";

import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";


export default function ItemMasterUploadView({ state }) {

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [isUploading, setIsUploading] =
        useState(false);

    const fileInputRef = useRef(null);


    const handleFileSelect = (e) => {

        const file = e.target.files?.[0];

        if (!file) return;


        if (file.name.toLowerCase().endsWith(".csv")) {

            setSelectedFile(file);

        } else {

            state.setAlertMessage?.(
                "Invalid file type. Please upload a strictly formatted CSV file."
            );

            state.setIsAlertOpen?.(true);

            setSelectedFile(null);
        }
    };


    const handleUpload = async () => {

        if (!selectedFile) return;

        setIsUploading(true);

        try {

            const result =
                await API.uploadItemMasterCSV(
                    selectedFile,
                    state.user.access_token
                );


            state.setAlertMessage?.(
                `Success: ${result.message}`
            );

            state.setIsAlertOpen?.(true);


            setSelectedFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

        } catch (err) {

            state.setAlertMessage?.(
                `Upload Failed: ${err.message}`
            );

            state.setIsAlertOpen?.(true);

        } finally {

            setIsUploading(false);

        }
    };


    const clearFile = () => {

        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

    };


    return (

        <Card className="mx-auto max-w-3xl">

            <CardHeader className="border-b bg-muted/20">

                <div className="flex items-center gap-3">

                    <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">

                        <FileSpreadsheet className="size-6" />

                    </div>


                    <div>

                        <CardTitle>
                            Bulk Import Product Master
                        </CardTitle>

                        <CardDescription>
                            Import structured product information using a CSV file.
                        </CardDescription>

                    </div>

                </div>

            </CardHeader>


            <CardContent className="space-y-6 p-6">


                {/* REQUIREMENTS */}

                <Alert className="border-blue-500/20 bg-blue-500/5">

                    <Info className="size-4 text-blue-600" />

                    <AlertTitle>
                        Data Formatting Requirements
                    </AlertTitle>


                    <AlertDescription className="mt-2 space-y-3">

                        <p>

                            Your CSV must contain the required
                            headers in the first row. Column names
                            are case-sensitive.

                        </p>


                        <div className="flex flex-wrap gap-2">

                            <Badge
                                variant="secondary"
                                className="font-mono"
                            >
                                Item code
                            </Badge>

                            <Badge
                                variant="secondary"
                                className="font-mono"
                            >
                                Item Specifications
                            </Badge>

                        </div>

                    </AlertDescription>

                </Alert>


                <Separator />


                {/* UPLOAD AREA */}

                <div
                    className={[
                        "rounded-xl border-2 border-dashed p-10 text-center transition-all",
                        selectedFile
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : "border-muted-foreground/20 bg-muted/20 hover:border-primary/50 hover:bg-primary/5",
                    ].join(" ")}
                >

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileSelect}
                    />


                    {selectedFile ? (

                        <div className="flex flex-col items-center">


                            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">

                                <FileCheck2 className="size-8" />

                            </div>


                            <h3 className="font-semibold">

                                {selectedFile.name}

                            </h3>


                            <p className="mt-1 text-sm text-muted-foreground">

                                {(
                                    selectedFile.size / 1024
                                ).toFixed(2)} KB ready for import

                            </p>


                            <div className="mt-6 flex flex-wrap justify-center gap-3">

                                <Button
                                    variant="outline"
                                    onClick={clearFile}
                                    disabled={isUploading}
                                >

                                    <X className="mr-2 size-4" />

                                    Cancel

                                </Button>


                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                >

                                    {isUploading ? (

                                        <Loader2 className="mr-2 size-4 animate-spin" />

                                    ) : (

                                        <Database className="mr-2 size-4" />

                                    )}


                                    {isUploading
                                        ? "Importing..."
                                        : "Commence Import"}

                                </Button>

                            </div>

                        </div>

                    ) : (

                        <div className="flex flex-col items-center">


                            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">

                                <Upload className="size-8" />

                            </div>


                            <h3 className="font-semibold">

                                Select a CSV file

                            </h3>


                            <p className="mt-2 max-w-sm text-sm text-muted-foreground">

                                Upload a structured product master CSV.
                                Maximum recommended file size: 5MB.

                            </p>


                            <Button
                                variant="outline"
                                className="mt-6"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                            >

                                <FileSpreadsheet className="mr-2 size-4 text-blue-500" />

                                Browse Local Files

                            </Button>

                        </div>

                    )}

                </div>


                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">

                    <FileSpreadsheet className="size-3.5 text-emerald-600" />

                    CSV files only • Maximum 5MB recommended

                </div>

            </CardContent>

        </Card>
    );
}