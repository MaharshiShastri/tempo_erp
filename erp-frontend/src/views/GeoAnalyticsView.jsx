import GeoMapCanvas from "../components/geo/GeoMapCanvas";
import SearchableMultiSelect from "../components/shared/SearchableMultiselect";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const themedInputClass =
  "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

export default function GeoAnalyticsView({ state }) {
  const stateList = Array.isArray(state?.indiaMap?.features)
    ? state.indiaMap.features
        .map((feature) => feature.properties?.ST_NM)
        .filter(Boolean)
        .sort()
    : [];

  const itemGroups = [
    ...new Set(
      (state.itemsMaster ?? [])
        .map((item) => item.item_group)
        .filter(Boolean)
    ),
  ].sort();

  const productCodes = (state.itemsMaster ?? [])
    .map((item) => item.item_code)
    .filter(Boolean);

  const isDispatchAnalytics =
    state?.user?.role === "Dispatch Engineer";

  const today = new Date().toISOString().split("T")[0];

  if (state.isLoading) {
    return (
      <Card className="w-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
        <CardHeader className="border-b border-[var(--border-light)]">
          <Skeleton className="h-7 w-72 bg-[var(--bg-muted)]" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-10 w-full bg-[var(--bg-muted)]" />
            <Skeleton className="h-10 w-full bg-[var(--bg-muted)]" />
            <Skeleton className="h-10 w-full bg-[var(--bg-muted)]" />
            <Skeleton className="h-10 w-full bg-[var(--bg-muted)]" />
          </div>

          <Skeleton className="h-[500px] w-full bg-[var(--bg-muted)]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
      <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-surface)]">
        <CardTitle className="text-xl text-[var(--text-primary)]">
          Geographic Analytics{" "}
          <span className="text-[var(--text-muted)]">
            {isDispatchAnalytics
              ? "- Dispatch Data"
              : "- Sales/Billing Data"}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          {/* From Date */}
          <div className="space-y-2">
            <Label
              htmlFor="geo-from-date"
              className="text-[var(--text-primary)]"
            >
              From Date
            </Label>

            <Input
              id="geo-from-date"
              type="date"
              min="2026-01-01"
              max={today}
              value={state.fromGeoDate}
              onChange={(e) =>
                state.setFromGeoDate(e.target.value)
              }
              className={themedInputClass}
            />
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label
              htmlFor="geo-to-date"
              className="text-[var(--text-primary)]"
            >
              To Date
            </Label>

            <Input
              id="geo-to-date"
              type="date"
              min={state.fromGeoDate}
              max={today}
              value={state.toGeoDate}
              onChange={(e) =>
                state.setToGeoDate(e.target.value)
              }
              className={themedInputClass}
            />
          </div>

          {/* States */}
          <div className="space-y-2">
            <SearchableMultiSelect
              label="States"
              options={stateList}
              value={state.selectedStates}
              onChange={state.setSelectedStates}
            />
          </div>

          {/* Products */}
          <div className="space-y-2">
            <SearchableMultiSelect
              label="Products"
              options={productCodes}
              value={state.selectedItems}
              onChange={state.setSelectedItems}
            />
          </div>

          {/* Product groups */}
          <div className="space-y-2 md:col-span-2 xl:col-span-4">
            <SearchableMultiSelect
              label="Product group"
              options={itemGroups}
              value={state.selectedGroups}
              onChange={state.setSelectedGroups}
            />
          </div>
        </div>

        {/* Selection summary */}
        <div className="flex flex-wrap gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-muted)] p-4">

          <Badge
            variant="secondary"
            className="border border-[var(--border-light)] bg-[var(--bg-main)] px-3 py-1.5 text-[var(--text-primary)]"
          >
            <span className="mr-1 font-semibold text-[var(--brand-accent)]">
              {state.selectedGroups.length}
            </span>
            Groups
          </Badge>

          <Badge
            variant="secondary"
            className="border border-[var(--border-light)] bg-[var(--bg-main)] px-3 py-1.5 text-[var(--text-primary)]"
          >
            <span className="mr-1 font-semibold text-[var(--brand-accent)]">
              {state.selectedItems.length}
            </span>
            Items
          </Badge>

          <Badge
            variant="secondary"
            className="border border-[var(--border-light)] bg-[var(--bg-main)] px-3 py-1.5 text-[var(--text-primary)]"
          >
            <span className="mr-1 font-semibold text-[var(--brand-accent)]">
              {state.selectedStates.length}
            </span>
            States
          </Badge>
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] shadow-[var(--shadow-sm)]">
          <GeoMapCanvas
            visibleMap={state.visibleMap}
            isDispatcher={isDispatchAnalytics}
          />
        </div>
      </CardContent>
    </Card>
  );
}