import { useEffect, useState } from "react";
export default function IndianCurrencyInput ({ value, onChange, className }){
    const [displayValue, setDisplayValue] = useState("");

    // On mount or prop change, format the raw number to Indian style
    useEffect(() => {
        if (value === 0 || value === "" || value === null) {
            setDisplayValue("");
            return;
        }
        const formatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
        setDisplayValue(formatter.format(value));
    }, [value]);

    const handleBlur = (e) => {
        const rawNum = parseFloat(e.target.value.replace(/,/g, '')) || 0;
        const formatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
        setDisplayValue(formatter.format(rawNum));
        onChange(rawNum); // Send raw number to parent state
    };

    const handleChange = (e) => {
        // Allow user to type freely (stripping letters)
        setDisplayValue(e.target.value.replace(/[^0-9.]/g, ''));
    };

    return (
        <input type="text" className={className} value={displayValue} onChange={handleChange} onBlur={handleBlur} placeholder="e.g., 1,50,000"/>
    );
};