import { useMemo, useState } from "react";
import {
    Building2,
    Search,
    Plus,
    MapPin,
    Users,
    SlidersHorizontal,
    X,
} from "lucide-react";

import CompanyCard from "../components/shared/CompanyCard.jsx";

export default function CompaniesListView({ state }) {
    const [search, setSearch] = useState("");
    const [stateFilter, setStateFilter] = useState("all");

    const companies = state.companiesMaster || [];

    const states = useMemo(() => {
        const values = new Set();

        companies.forEach((company) => {
            if (company.state) {
                values.add(company.state);
            }
        });

        return [...values].sort((a, b) =>
            a.localeCompare(b)
        );
    }, [companies]);

    const filteredCompanies = useMemo(() => {
        const query = search.trim().toLowerCase();

        return companies.filter((company) => {
            const matchesSearch =
                !query ||
                [
                    company.name,
                    company.id,
                    company.contact_name,
                    company.contact_phone,
                    company.city,
                    company.state,
                    company.pincode,
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value)
                            .toLowerCase()
                            .includes(query)
                    );

            const matchesState =
                stateFilter === "all" ||
                company.state === stateFilter;

            return matchesSearch && matchesState;
        });
    }, [companies, search, stateFilter]);

    const hasFilters =
        Boolean(search.trim()) ||
        stateFilter !== "all";

    const clearFilters = () => {
        setSearch("");
        setStateFilter("all");
    };

    return (
        <div className="space-y-4">
            {/* HEADER */}
            <div className="overflow-hidden rounded-xl border border-primary/20 bg-card shadow-sm">
                <div className="bg-gradient-to-r from-primary/10 via-background to-blue-500/10 p-5 md:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <Building2 className="size-5" />
                            </div>

                            <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Users className="size-3.5 text-blue-500" />
                                    <span>CRM</span>
                                    <span>/</span>
                                    <span>Client Directory</span>
                                </div>

                                <h2 className="text-xl font-semibold tracking-tight">
                                    Customer Accounts
                                </h2>

                                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                    Manage corporate customers, contacts,
                                    locations and account information from
                                    one centralized directory.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm">
                                <Building2 className="size-4 text-primary" />

                                <span className="font-semibold">
                                    {companies.length}
                                </span>

                                <span className="text-muted-foreground">
                                    clients
                                </span>
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary flex items-center gap-2"
                                onClick={() =>
                                    state.triggerNewCompany()
                                }
                            >
                                <Plus className="size-4" />
                                Add Client

                                <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                                    Alt+N
                                </kbd>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEARCH / FILTER BAR */}
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div className="flex-1">
                        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Search className="size-3.5 text-blue-500" />
                            Search clients
                        </label>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search company, client code, contact, city or phone..."
                                className="form-input w-full !pl-11 !pr-10"
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-2 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="lg:w-[240px]">
                        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <MapPin className="size-3.5 text-emerald-500" />
                            State / Province
                        </label>

                        <select
                            value={stateFilter}
                            onChange={(event) =>
                                setStateFilter(event.target.value)
                            }
                            className="form-input w-full"
                        >
                            <option value="all">
                                All states
                            </option>

                            {states.map((stateName) => (
                                <option
                                    key={stateName}
                                    value={stateName}
                                >
                                    {stateName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <SlidersHorizontal className="size-4" />
                            Clear
                        </button>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <div className="text-xs text-muted-foreground">
                        Showing{" "}
                        <span className="font-semibold text-foreground">
                            {filteredCompanies.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-foreground">
                            {companies.length}
                        </span>{" "}
                        customer accounts
                    </div>

                    {hasFilters && (
                        <div className="text-xs text-muted-foreground">
                            Filtered results
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENT */}
            {filteredCompanies.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-card p-12 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        {companies.length === 0 ? (
                            <Building2 className="size-7" />
                        ) : (
                            <Search className="size-7" />
                        )}
                    </div>

                    <h3 className="text-base font-semibold">
                        {companies.length === 0
                            ? "No Clients Found"
                            : "No Matching Clients"}
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                        {companies.length === 0
                            ? "You haven't registered any enterprise customers yet."
                            : "Try adjusting your search or state filter to find another customer account."}
                    </p>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="btn btn-secondary mt-5"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {filteredCompanies.map((company) => (
                        <CompanyCard
                            key={company.id}
                            company={company}
                            state={state}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}