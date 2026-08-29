import GeoMapCanvas from "../components/geo/GeoMapCanvas";
import SearchableMultiSelect from "../components/shared/SearchableMultiselect";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-72" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Geographic Analytics{" "}
          <span className="text-muted-foreground">
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
            <Label htmlFor="geo-from-date">
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
            />
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label htmlFor="geo-to-date">
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
        <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/40 p-4">
          <Badge variant="secondary" className="px-3 py-1.5">
            <span className="mr-1 font-semibold">
              {state.selectedGroups.length}
            </span>
            Groups
          </Badge>

          <Badge variant="secondary" className="px-3 py-1.5">
            <span className="mr-1 font-semibold">
              {state.selectedItems.length}
            </span>
            Items
          </Badge>

          <Badge variant="secondary" className="px-3 py-1.5">
            <span className="mr-1 font-semibold">
              {state.selectedStates.length}
            </span>
            States
          </Badge>
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-lg border">
          <GeoMapCanvas
            visibleMap={state.visibleMap}
            isDispatcher={isDispatchAnalytics}
          />
        </div>
      </CardContent>
    </Card>
  );
}