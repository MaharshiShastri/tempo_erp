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

        <Card className="mx-auto max-w-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">

            <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">

                <div className="flex items-center gap-3">

                    <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--bg-main)] text-[var(--brand-accent)]">

                        <FileSpreadsheet className="size-6" />

                    </div>


                    <div>

                        <CardTitle className="text-[var(--text-primary)]">
                            Bulk Import Product Master
                        </CardTitle>

                        <CardDescription className="text-[var(--text-muted)]">
                            Import structured product information using a CSV file.
                        </CardDescription>

                    </div>

                </div>

            </CardHeader>


            <CardContent className="space-y-6 p-6">


                {/* REQUIREMENTS */}

                <Alert className="border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-primary)]">

                    <Info className="size-4 text-[var(--brand-accent)]" />

                    <AlertTitle className="text-[var(--text-primary)]">
                        Data Formatting Requirements
                    </AlertTitle>


                    <AlertDescription className="mt-2 space-y-3 text-[var(--text-muted)]">

                        <p>

                            Your CSV must contain the required
                            headers in the first row. Column names
                            are case-sensitive.

                        </p>


                        <div className="flex flex-wrap gap-2">

                            <Badge
                                variant="secondary"
                                className="border border-[var(--border-light)] bg-[var(--bg-main)] font-mono text-[var(--text-primary)]"
                            >
                                Item code
                            </Badge>

                            <Badge
                                variant="secondary"
                                className="border border-[var(--border-light)] bg-[var(--bg-main)] font-mono text-[var(--text-primary)]"
                            >
                                Item Specifications
                            </Badge>

                        </div>

                    </AlertDescription>

                </Alert>


                <Separator className="bg-[var(--border-light)]" />


                {/* UPLOAD AREA */}

                <div
                    className={[
                        "rounded-xl border-2 border-dashed p-10 text-center transition-all",
                        selectedFile
                            ? "border-[var(--brand-success)] bg-[var(--bg-muted)]"
                            : "border-[var(--border-light)] bg-[var(--bg-muted)] hover:border-[var(--brand-accent)] hover:bg-[var(--combobox-hover)]",
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


                            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[var(--bg-main)] text-[var(--brand-success)]">

                                <FileCheck2 className="size-8" />

                            </div>


                            <h3 className="font-semibold text-[var(--text-primary)]">

                                {selectedFile.name}

                            </h3>


                            <p className="mt-1 text-sm text-[var(--text-muted)]">

                                {(
                                    selectedFile.size / 1024
                                ).toFixed(2)} KB ready for import

                            </p>


                            <div className="mt-6 flex flex-wrap justify-center gap-3">

                                <Button
                                    variant="outline"
                                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                                    onClick={clearFile}
                                    disabled={isUploading}
                                >

                                    <X className="mr-2 size-4" />

                                    Cancel

                                </Button>


                                <Button
                                    className="bg-[var(--brand-success)] text-white hover:opacity-90"
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


                            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[var(--bg-main)] text-[var(--brand-accent)]">

                                <Upload className="size-8" />

                            </div>


                            <h3 className="font-semibold text-[var(--text-primary)]">

                                Select a CSV file

                            </h3>


                            <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">

                                Upload a structured product master CSV.
                                Maximum recommended file size: 5MB.

                            </p>


                            <Button
                                variant="outline"
                                className="mt-6 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                            >

                                <FileSpreadsheet className="mr-2 size-4 text-[var(--brand-accent)]" />

                                Browse Local Files

                            </Button>

                        </div>

                    )}

                </div>


                <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">

                    <FileSpreadsheet className="size-3.5 text-[var(--brand-success)]" />

                    CSV files only • Maximum 5MB recommended

                </div>

            </CardContent>

        </Card>
    );
}