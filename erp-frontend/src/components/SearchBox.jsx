import { useState } from "react";
import { useEffect, useRef } from "react";

export default function SearchBox({ searchUrl, onSelect, placeholder }) {
    const [text, setText] = useState("");
    const [results, setResults] = useState([]);
    const [showList, setShowList] = useState(false);
    const wrapperRef = useRef();
    const handleChange = async (value) => {
        setText(value);

        if (value.length < 2) {
            setResults([]);
            return;
        }

        try {
            const res = await fetch(`${searchUrl}?q=${value}`,);
            const data = await res.json();

            setResults(data);
            setShowList(true);
        } catch (err) {
            console.error("Search failed", err);
        }
    };

    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowList(false);
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    return (
        <div ref={wrapperRef} style={{ position: "relative" }}>
            {/* INPUT BOX */}
            <input
                className="form-input"
                placeholder={placeholder}
                value={text}
                onChange={(e) => handleChange(e.target.value)}
            />

            {/* DROPDOWN LIST */}
            {showList && results.length > 0 && (
                <div className="dropdown">
                    {results.map((item, index) => (
                        <div
                            key={index}
                            className="dropdown-item"
                            onClick={() => {
                                onSelect(item);        // send selected item to parent
                                setText(item.name || item.item_name);
                                setShowList(false);
                            }}
                        >
                            {item.id || item.item_code} — {item.name || item.item_name}
                        </div>
                    ))}
                </div>
            )}
            {showList && results.length === 0 &&(
                <div className="dropdown">
                    <div className="dropdown-item" style={{ color: "#888" }}>
                        No matches found
                    </div>
                </div>
            )}
        </div>
    );
}