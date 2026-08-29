import React from "react";
import {
    Building2,
    MapPin,
    Phone,
    UserRound,
    Pencil,
    Trash2,
} from "lucide-react";

export default function CompanyCard({ company, state }) {
    const address = [
        company.address_line_1,
        company.city,
        company.state,
        company.pincode,
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <div className="group overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            {/* CARD HEADER */}
            <div className="border-b border-border/70 bg-gradient-to-r from-primary/5 via-background to-blue-500/5 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Building2 className="size-5" />
                        </div>

                        <div className="min-w-0">
                            <div className="mb-1 inline-flex items-center rounded-md border border-border/70 bg-muted/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                                {company.id}
                            </div>

                            <h3 className="truncate text-sm font-semibold text-foreground">
                                {company.name ||
                                    "Unnamed Company"}
                            </h3>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        <button
                            type="button"
                            onClick={() => state.triggerEditCompany(company.id)}
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            title="Edit client"
                        >
                            <Pencil className="size-4" />
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                state.deleteCompany(
                                    company.id
                                )
                            }
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                            title="Delete client"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* BODY */}
            <div className="space-y-4 p-4">
                {/* LOCATION */}
                <div>
                    <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        <MapPin className="size-3.5 text-blue-500" />
                        Location
                    </div>

                    <p className="text-sm leading-relaxed text-foreground/90">
                        {address || "Address not available"}
                    </p>
                </div>

                {/* CONTACT */}
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        <UserRound className="size-3.5 text-emerald-500" />
                        Primary Contact
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                                {company.contact_name ||
                                    "Contact not available"}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {company.contact_role ||
                                    "Primary Representative"}
                            </p>
                        </div>

                        {company.contact_phone && (
                            <a
                                href={`tel:${company.contact_phone}`}
                                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                title={`Call ${company.contact_phone}`}
                            >
                                <Phone className="size-4" />
                            </a>
                        )}
                    </div>

                    {company.contact_phone && (
                        <div className="mt-2 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                            {company.contact_phone}
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between border-t border-border/60 bg-muted/10 px-4 py-3">
                <span className="text-xs text-muted-foreground">
                    Customer Account
                </span>

                <button
                    type="button"
                    onClick={() =>
                        state.triggerEditCompany(
                            company.id
                        )
                    }
                    className="text-xs font-medium text-primary transition-colors hover:underline"
                >
                    View / Edit
                </button>
            </div>
        </div>
    );
}