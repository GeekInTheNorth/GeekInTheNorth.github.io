// Loaded synchronously in <head> so the saved theme is applied before first paint.
(function () {
    const storageKey = "theme";
    const root = document.documentElement;
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function getSavedTheme() {
        try {
            return localStorage.getItem(storageKey);
        } catch (e) {
            return null;
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(storageKey, theme);
        } catch (e) {
            // Storage unavailable (e.g. private browsing); the toggle still works for this visit.
        }
    }

    function getCurrentTheme() {
        const explicit = root.getAttribute("data-theme");
        if (explicit) return explicit;
        return darkQuery.matches ? "dark" : "light";
    }

    root.classList.remove("no-js");
    root.classList.add("js");

    const savedTheme = getSavedTheme();
    if (savedTheme === "dark" || savedTheme === "light") {
        root.setAttribute("data-theme", savedTheme);
    }

    document.addEventListener("DOMContentLoaded", function () {
        const toggles = document.querySelectorAll(".js-theme-toggle");

        function syncToggles() {
            const isDark = getCurrentTheme() === "dark";
            toggles.forEach(function (toggle) {
                toggle.setAttribute("aria-pressed", isDark ? "true" : "false");
            });

            // The Website Carbon badge has a dark variant.
            const carbonBadge = document.getElementById("wcb");
            if (carbonBadge) {
                carbonBadge.classList.toggle("wcb-d", isDark);
            }
        }

        toggles.forEach(function (toggle) {
            toggle.addEventListener("click", function () {
                const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
                root.setAttribute("data-theme", nextTheme);
                saveTheme(nextTheme);
                syncToggles();
            });
        });

        darkQuery.addEventListener("change", syncToggles);
        syncToggles();
    });
})();
