// Highlights the "In this article" link for the section currently being read.
// The contents list works as plain links without this script.
document.addEventListener("DOMContentLoaded", function () {
    const rail = document.querySelector(".toc");
    if (!rail || !("IntersectionObserver" in window)) return;

    const links = new Map();
    rail.querySelectorAll("a[href^='#']").forEach(function (link) {
        links.set(decodeURIComponent(link.getAttribute("href").slice(1)), link);
    });

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            const link = links.get(entry.target.id);
            if (!link) return;

            rail.querySelectorAll("[aria-current]").forEach(function (current) {
                current.removeAttribute("aria-current");
            });
            link.setAttribute("aria-current", "true");
        });
    }, { rootMargin: "0px 0px -70% 0px" });

    document.querySelectorAll(".prose h2[id]").forEach(function (heading) {
        if (links.has(heading.id)) {
            observer.observe(heading);
        }
    });
});
