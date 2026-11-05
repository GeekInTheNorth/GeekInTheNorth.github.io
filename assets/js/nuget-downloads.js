// Fills in live download counts and the latest version for each add-on from nuget.org and the
// Optimizely NuGet feed. Elements start with a "View on NuGet" link (or are hidden) so nothing on the
// page needs updating by hand, and the page still makes sense if a feed cannot be reached.
document.addEventListener("DOMContentLoaded", function () {

    const requests = new Map();

    function formatDownloads(total) {
        return (Math.floor(total / 500) * 500).toLocaleString("en-GB") + "+";
    }

    function setText(section, selector, value) {
        if (!value) return;
        section.querySelectorAll(selector).forEach(element => {
            element.textContent = value;
        });
    }

    function findPackage(response, packageId) {
        return (response.data || []).find(pkg => pkg.id && pkg.id.toLowerCase() === packageId.toLowerCase());
    }

    // Each feed URL is requested once per page, however many times the package is shown.
    function fetchFeed(url) {
        if (!requests.has(url)) {
            requests.set(url, fetch(url).then(response => response.ok ? response.json() : Promise.reject()));
        }
        return requests.get(url);
    }

    function updateStats(section, url, packageId, onMatch) {
        fetchFeed(url)
            .then(response => {
                const pkg = findPackage(response, packageId);
                if (pkg) {
                    onMatch(pkg);
                }
            })
            .catch(() => { /* leave the fallback content in place */ });
    }

    document.querySelectorAll("[data-package-id]").forEach(section => {
        const packageId = section.dataset.packageId;

        if (section.dataset.nugetUrl) {
            updateStats(section, section.dataset.nugetUrl, packageId, pkg => {
                setText(section, "[data-nuget-downloads]", formatDownloads(pkg.totalDownloads));
                setText(section, "[data-package-version]", pkg.version);
                if (section.hasAttribute("data-nuget-reveal")) {
                    section.hidden = false;
                }
            });
        }

        if (section.dataset.optimizelyUrl) {
            updateStats(section, section.dataset.optimizelyUrl, packageId, pkg => {
                setText(section, "[data-optimizely-downloads]", formatDownloads(pkg.totalDownloads));
            });
        }
    });

});
