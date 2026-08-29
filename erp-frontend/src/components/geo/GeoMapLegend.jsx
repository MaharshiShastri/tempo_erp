import { Card } from "@/components/ui/card";

export default function GeoMapLegend() {
  const levels = [
    {
      color: "#08306b",
      label: "> ₹5,00,000",
    },
    {
      color: "#2171b5",
      label: "₹2,50,000 - ₹5,00,000",
    },
    {
      color: "#6baed6",
      label: "₹1,00,000 - ₹2,50,000",
    },
    {
      color: "#c6dbef",
      label: "₹1 - ₹1,00,000",
    },
    {
      color: "#f2f2f2",
      label: "No sales",
    },
  ];

  return (
    <Card className="absolute bottom-4 right-4 z-10 w-56 bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="mb-3 text-sm font-semibold">
        Revenue
      </div>

      <div className="space-y-2">
        {levels.map((level) => (
          <div
            key={level.label}
            className="flex items-center gap-2 text-xs"
          >
            <div
              className="size-4 shrink-0 rounded-sm border"
              style={{
                backgroundColor: level.color,
              }}
            />

            <span>{level.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}