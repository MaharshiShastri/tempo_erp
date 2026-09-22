import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export default function IndianCurrencyInput({
  value,
  onChange,
  className,
}) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value === 0 || value === "" || value === null || value === undefined) {
      setDisplayValue("");
      return;
    }

    setDisplayValue(
      new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
      }).format(value)
    );
  }, [value]);

  const handleChange = (e) => {
    let input = e.target.value.replace(/[^0-9.]/g, "");

    // Allow only one decimal point
    const parts = input.split(".");
    if (parts.length > 2) {
      input = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    setDisplayValue(input);
  };

  const handleBlur = () => {
    const rawNum = parseFloat(displayValue.replace(/,/g, "")) || 0;

    setDisplayValue(
      rawNum
        ? new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 2,
          }).format(rawNum)
        : ""
    );

    onChange(rawNum);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ₹
      </span>

      <Input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="1,50,000"
        className={`pl-8 ${className || ""}`}
      />
    </div>
  );
}