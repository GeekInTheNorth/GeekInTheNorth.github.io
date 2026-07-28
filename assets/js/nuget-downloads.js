document.addEventListener("DOMContentLoaded", function () {

    function formatDownloads(total) {
        return (Math.floor(total / 500) * 500).toLocaleString("en-GB") + "+";
    }

    function setText(section, selector, value) {
        const element = section.querySelector(selector);
        if (element && value) {
            element.textContent = value;
        }
    }

    function findPackage(response, packageId) {
        return (response.data || []).find(pkg => pkg.id && pkg.id.toLowerCase() === packageId.toLowerCase());
    }

    function updateStats(section, url, packageId, onMatch) {
        fetch(url)
            .then(response => response.ok ? response.json() : Promise.reject())
            .then(response => {
                const pkg = findPackage(response, packageId);
                if (pkg) {
                    onMatch(pkg);
                }
            })
            .catch(() => { /* leave the static fallback values in place */ });
    }

    document.querySelectorAll("section[data-package-id]").forEach(section => {
        const packageId = section.dataset.packageId;

        if (section.dataset.nugetUrl) {
            updateStats(section, section.dataset.nugetUrl, packageId, pkg => {
                setText(section, "[data-nuget-downloads]", formatDownloads(pkg.totalDownloads));
                setText(section, "[data-package-version]", pkg.version);
            });
        }

        if (section.dataset.optimizelyUrl) {
            updateStats(section, section.dataset.optimizelyUrl, packageId, pkg => {
                setText(section, "[data-optimizely-downloads]", formatDownloads(pkg.totalDownloads));
            });
        }
    });

});
