// Filters a section page's article list by category and year, keeping the choice in the URL
// (?category=...&year=...) so a filtered view can be shared. Without this script every article is listed.
document.addEventListener("DOMContentLoaded", function () {
    const archive = document.querySelector("[data-archive]");
    if (!archive) return;

    const filterBar = archive.querySelector("[data-filter-bar]");
    const categorySelect = archive.querySelector("[data-filter='category']");
    const yearSelect = archive.querySelector("[data-filter='year']");
    const status = archive.querySelector("[data-filter-status]");
    const reset = archive.querySelector("[data-filter-reset]");
    const empty = archive.querySelector("[data-filter-empty]");
    const rows = archive.querySelectorAll("li[data-year]");
    const filters = [
        { select: categorySelect, param: "category" },
        { select: yearSelect, param: "year" }
    ].filter(filter => filter.select);

    if (!filters.length) return;

    function describe(count) {
        return count === 1 ? "1 article" : `${count} articles`;
    }

    function updateUrl() {
        const params = new URLSearchParams(window.location.search);
        filters.forEach(function (filter) {
            if (filter.select.value) {
                params.set(filter.param, filter.select.value);
            } else {
                params.delete(filter.param);
            }
        });
        const query = params.toString();
        history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : "") + window.location.hash);
    }

    function applyFilters() {
        const category = categorySelect ? categorySelect.value : "";
        const year = yearSelect ? yearSelect.value : "";
        let shown = 0;

        rows.forEach(function (row) {
            const matches = (!category || row.dataset.categories.includes(`|${category}|`))
                && (!year || row.dataset.year === year);
            row.hidden = !matches;
            if (matches) shown++;
        });

        const filtered = Boolean(category || year);
        status.textContent = filtered ? `Showing ${shown} of ${describe(rows.length)}` : describe(rows.length);
        reset.hidden = !filtered;
        empty.hidden = shown > 0;
    }

    // Start from any filters in the URL, ignoring values that are not offered on this page.
    const params = new URLSearchParams(window.location.search);
    filters.forEach(function (filter) {
        const value = params.get(filter.param);
        if (value && Array.from(filter.select.options).some(option => option.value === value)) {
            filter.select.value = value;
        }

        filter.select.addEventListener("change", function () {
            applyFilters();
            updateUrl();
        });
    });

    reset.addEventListener("click", function () {
        filters.forEach(filter => { filter.select.value = ""; });
        applyFilters();
        updateUrl();
        filters[0].select.focus();
    });

    filterBar.hidden = false;
    applyFilters();
});
