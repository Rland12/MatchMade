// FiltersDropdown.jsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

const SEASONS = [
    { id: "christmas", label: "Christmas" },
    { id: "halloween", label: "Halloween" },
];


const PAIR_TYPES = [
    { tag: "gender_gg", label: "girl x girl" },
    { tag: "gender_bb", label: "boy x boy" },
    { tag: "poc", label: "poc" },
];

export default function FiltersDropdown() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();
    const currentHoliday = (searchParams.get("holiday") || "").toLowerCase();
    const currentFilters = (searchParams.get("filters") || "")
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const hasAnyFilter = !!currentHoliday || currentFilters.length > 0;

    const activeTypes = PAIR_TYPES.filter((pt) =>
        currentFilters.includes(pt.tag)
    );

    const activeSeasonLabel =
        SEASONS.find((s) => s.id === currentHoliday)?.label || null;

    const activeTypesLabel =
        activeTypes.length > 0 ? activeTypes.map((t) => t.label).join(" · ") : "";

    // how many things are “on” (season counts as 1, each type as 1)
    const filterCount =
        (currentHoliday ? 1 : 0) + activeTypes.length;

    // verbose: “Christmas · boy x boy · poc”
    const detailedSummary = [
        activeSeasonLabel,
        activeTypesLabel || null,
    ]
        .filter(Boolean)
        .join(" · ");

    // compact: when lots are selected, shorten to “Christmas · 2 filters”
    const compactSummary =
        filterCount > 2
            ? [
                activeSeasonLabel,
                `${filterCount - (activeSeasonLabel ? 1 : 0)} filters`,
            ]
                .filter(Boolean)
                .join(" · ")
            : detailedSummary;


    const setSeason = (id) => {
        const next = new URLSearchParams(searchParams);

        if (currentHoliday === id) {
            next.delete("holiday");
        } else {
            next.set("holiday", id);
        }

        const search = `?${next.toString()}`;

        navigate({ pathname: "/", search });
        setOpen(false);
    };

    // close when clicking outside
    useEffect(() => {
        if (!open) return;

        const handleClick = (e) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClick);
        document.addEventListener("touchstart", handleClick);

        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("touchstart", handleClick);
        };
    }, [open]);

    const toggleType = (tag) => {
        const next = new URLSearchParams(searchParams);
        let filters = (next.get("filters") || "")
            .toLowerCase()
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        const isOn = filters.includes(tag);

        if (isOn) {
            // Turn OFF this tag
            filters = filters.filter((t) => t !== tag);
        } else {
            // Turn ON this tag
            if (tag === "gender_gg" || tag === "gender_bb") {
                // Only one gender tag allowed at a time
                filters = filters.filter(
                    (t) => t !== "gender_gg" && t !== "gender_bb"
                );
            }
            filters.push(tag);
        }

        if (filters.length) {
            next.set("filters", filters.join(","));
        } else {
            next.delete("filters");
        }

        next.set("page", "1");
        setSearchParams(next);
    };

    return (
        <div className="seasonal-wrapper" ref={wrapperRef}>
            <button
                type="button"
                className={
                    "category seasonal-toggle" + (hasAnyFilter ? " active" : "")
                }
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={open}
            >
                <span>Filters: </span>
                {hasAnyFilter && compactSummary && (
                    <span className="seasonal-chip">
                        {compactSummary}
                    </span>
                )}
                <span className="caret">▾</span>
            </button>

            <div
                className={
                    "seasonal-menu" + (open ? " seasonal-menu-open" : "")
                }
            >
                <div className="seasonal-section">
                    <div className="seasonal-section-label">Season</div>
                    {SEASONS.map((season) => (
                        <button
                            key={season.id || "all"}
                            type="button"
                            className={
                                "seasonal-option" +
                                (currentHoliday === season.id ? " active" : "")
                            }
                            onClick={() => setSeason(season.id)}
                        >
                            {season.label}
                        </button>
                    ))}
                </div>

                <div className="seasonal-section">
                    <div className="seasonal-section-label">Pair type</div>
                    {PAIR_TYPES.map((pt) => {
                        const isActive = currentFilters.includes(pt.tag);
                        return (
                            <button
                                key={pt.tag}
                                type="button"
                                className={
                                    "seasonal-option" + (isActive ? " active" : "")
                                }
                                onClick={() => toggleType(pt.tag)}
                            >
                                {pt.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
