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

    // Each feed URL is requested once per page, however many times the package is shown.
    function fetchFeed(url) {
        if (!requests.has(url)) {
            requests.set(url, fetch(url).then(response => response.ok ? response.json() : Promise.reject()));
        }
        return requests.get(url);
    }

    // Resolves to the package from a feed, or null if the feed cannot be reached or does not list it.
    function findPackage(url, packageId) {
        if (!url) return Promise.resolve(null);
        return fetchFeed(url)
            .then(response => (response.data || []).find(pkg => pkg.id && pkg.id.toLowerCase() === packageId.toLowerCase()) || null)
            .catch(() => null);
    }

    document.querySelectorAll("[data-package-id]").forEach(section => {
        const packageId = section.dataset.packageId;
        const nugetPackage = findPackage(section.dataset.nugetUrl, packageId);
        const optimizelyPackage = findPackage(section.dataset.optimizelyUrl, packageId);

        nugetPackage.then(pkg => {
            if (!pkg) return;
            setText(section, "[data-nuget-downloads]", formatDownloads(pkg.totalDownloads));
            setText(section, "[data-package-version]", pkg.version);
        });

        optimizelyPackage.then(pkg => {
            if (!pkg) return;
            setText(section, "[data-optimizely-downloads]", formatDownloads(pkg.totalDownloads));
        });

        // Combined figures and hidden lines wait for both feeds, so a total is never shown half-loaded.
        Promise.all([nugetPackage, optimizelyPackage]).then(([nuget, optimizely]) => {
            const total = (nuget ? nuget.totalDownloads : 0) + (optimizely ? optimizely.totalDownloads : 0);
            if (total) {
                setText(section, "[data-total-downloads]", formatDownloads(total));
            }

            if (nuget && section.hasAttribute("data-nuget-reveal")) {
                section.hidden = false;
            }
        });
    });

});
