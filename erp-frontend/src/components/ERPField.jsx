import { useState } from "react";

const SEARCH_ENDPOINTS = {
    company: "/api/v1/orders/search/companies",
    item: "/api/v1/master/items/search",
    user: "/api/v1/auth/users/search" // future-ready
};

export default function ERPField({
    type,
    placeholder,
    onSelect,
    displayKey = "name",
    valueKey = "id"
}) {
    const [text, setText] = useState("");
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);

    const search = async (val) => {
        setText(val);

        if (val.length < 2) {
            setResults([]);
            return;
        }

        const url = SEARCH_ENDPOINTS[type];
        if (!url) return;

        const res = await fetch(`${url}?q=${val}`);
        const data = await res.json();

        setResults(data);
        setOpen(true);
    };

    const getLabel = (item) => {
        if (type === "item") return `${item.item_code} - ${item.item_name}`;
        if (type === "company") return `${item.id} - ${item.name}`;
        return item[displayKey];
    };

    return (
        <div style={{ position: "relative" }}>
            <input
                className="form-input"
                placeholder={placeholder}
                value={text}
                onChange={(e) => search(e.target.value)}
            />

            {open && results.length > 0 && (
                <div className="dropdown">
                    {results.map((item, idx) => (
                        <div
                            key={idx}
                            className="dropdown-item"
                            onClick={() => {
                                setText(getLabel(item));
                                setOpen(false);
                                onSelect(item);
                            }}
                        >
                            {getLabel(item)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}