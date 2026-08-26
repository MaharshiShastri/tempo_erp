import { useMemo, useState } from "react";

export default function SearchableMultiselect({
    label,
    options = [],
    value = [],
    onChange,
    compact = false,
}) {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const filtered = useMemo(
        () =>
            (options ?? []).filter((option) =>
                option
                    .toLowerCase()
                    .includes(search.toLowerCase())
            ),
        [options, search]
    );

    if (compact) {
        return (
            <div style={{ position: "relative" }}>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsOpen((prev) => !prev)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        padding: "6px 10px",
                    }}
                >
                    {label}

                    {value.length > 0 && (
                        <span
                            style={{
                                background: "var(--brand-accent)",
                                color: "#fff",
                                borderRadius: 10,
                                padding: "1px 6px",
                                fontSize: 10,
                            }}
                        >
                            {value.length}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <>
                        <div
                            onClick={() => setIsOpen(false)}
                            style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 99,
                            }}
                        />

                        <div
                            style={{
                                position: "absolute",
                                top: "calc(100% + 6px)",
                                left: 0,
                                zIndex: 100,
                                width: 320,
                                background: "var(--bg-surface)",
                                border: "1px solid var(--border-light)",
                                borderRadius: 8,
                                padding: 12,
                                boxShadow:
                                    "0 8px 24px rgba(0,0,0,0.15)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems: "center",
                                    marginBottom: 8,
                                }}
                            >
                                <b style={{ fontSize: 12 }}>
                                    {label}
                                </b>

                                <span
                                    style={{
                                        fontSize: 10,
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    {options.length} options
                                </span>
                            </div>

                            <input
                                className="form-input"
                                placeholder={`Search ${label}`}
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />

                            <div
                                style={{
                                    maxHeight: 220,
                                    overflowY: "auto",
                                    marginTop: 8,
                                }}
                            >
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: 8,
                                        fontSize: 12,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={
                                            options.length > 0 &&
                                            value.length ===
                                                options.length
                                        }
                                        onChange={(e) =>
                                            onChange(
                                                e.target.checked
                                                    ? options
                                                    : []
                                            )
                                        }
                                    />{" "}
                                    Select All
                                </label>

                                <hr />

                                {filtered.map((option) => (
                                    <label
                                        key={option}
                                        style={{
                                            display: "block",
                                            marginBottom: 6,
                                            fontSize: 12,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={value.includes(
                                                option
                                            )}
                                            onChange={(e) => {
                                                if (
                                                    e.target.checked
                                                ) {
                                                    onChange([
                                                        ...value,
                                                        option,
                                                    ]);
                                                } else {
                                                    onChange(
                                                        value.filter(
                                                            (s) =>
                                                                s !==
                                                                option
                                                        )
                                                    );
                                                }
                                            }}
                                        />{" "}
                                        {option}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Existing full-size implementation
    return (
        <div style={{ width: 320 }}>
            <b>
                {label} ({options?.length})
            </b>

            <input
                className="form-input"
                placeholder={`Search ${label}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <div
                style={{
                    maxHeight: 220,
                    overflowY: "auto",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    padding: 8,
                    marginTop: 6,
                }}
            >
                <label>
                    <input
                        type="checkbox"
                        checked={
                            value.length === options.length
                        }
                        onChange={(e) =>
                            onChange(
                                e.target.checked
                                    ? options
                                    : []
                            )
                        }
                    />{" "}
                    Select All
                </label>

                <hr />

                {filtered.map((option) => (
                    <label
                        key={option}
                        style={{
                            display: "block",
                            marginBottom: 6,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={value.includes(option)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    onChange([
                                        ...value,
                                        option,
                                    ]);
                                } else {
                                    onChange(
                                        value.filter(
                                            (s) =>
                                                s !== option
                                        )
                                    );
                                }
                            }}
                        />{" "}
                        {option}
                    </label>
                ))}
            </div>
        </div>
    );
}