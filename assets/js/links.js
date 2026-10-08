// Loaded synchronously in <head> so the saved theme is applied before first paint.
(function () {
    const storageKey = "links_theme";

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
        const explicit = document.documentElement.getAttribute("data-theme");
        if (explicit) return explicit;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    const savedTheme = getSavedTheme();
    if (savedTheme === "dark" || savedTheme === "light") {
        document.documentElement.setAttribute("data-theme", savedTheme);
    }

    document.addEventListener("DOMContentLoaded", function () {
        const toast = document.querySelector(".js-toast");
        let toastTimer = null;

        function showToast(message) {
            if (!toast) return;
            toast.textContent = message;
            toast.classList.add("is-visible");
            clearTimeout(toastTimer);
            toastTimer = setTimeout(function () {
                toast.classList.remove("is-visible");
            }, 2500);
        }

        const themeToggle = document.querySelector(".js-theme-toggle");
        if (themeToggle) {
            themeToggle.addEventListener("click", function () {
                const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
                document.documentElement.setAttribute("data-theme", nextTheme);
                saveTheme(nextTheme);
            });
        }

        const shareButton = document.querySelector(".js-share");
        if (shareButton) {
            shareButton.addEventListener("click", async function () {
                const shareData = {
                    title: shareButton.dataset.shareTitle,
                    url: shareButton.dataset.shareUrl
                };

                if (navigator.share) {
                    try {
                        await navigator.share(shareData);
                        return;
                    } catch (e) {
                        // User cancelled the share sheet; nothing else to do.
                        if (e.name === "AbortError") return;
                    }
                }

                try {
                    await navigator.clipboard.writeText(shareData.url);
                    showToast("Link copied to clipboard");
                } catch (e) {
                    showToast(shareData.url);
                }
            });
        }
    });
})();
