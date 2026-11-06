// Site header behaviour (see header.css):
// - the menu button for the main navigation on small screens. aria-expanded on the button is the only
//   state; the CSS hides the nav that follows it while it is "false".
// - the sticky header tucks away while scrolling down and slides back on scrolling up.
document.addEventListener("DOMContentLoaded", function () {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const root = document.documentElement;
    const button = header.querySelector(".js-nav-toggle");
    const nav = button && document.getElementById(button.getAttribute("aria-controls"));

    function isMenuOpen() {
        return !!button && button.getAttribute("aria-expanded") === "true";
    }

    if (button && nav) {
        button.addEventListener("click", function () {
            button.setAttribute("aria-expanded", isMenuOpen() ? "false" : "true");
        });

        // Escape closes the open menu and returns focus to the button.
        [button, nav].forEach(function (element) {
            element.addEventListener("keydown", function (event) {
                if (event.key !== "Escape" || !isMenuOpen()) return;
                button.setAttribute("aria-expanded", "false");
                button.focus();
            });
        });
    }

    // --site-header-height feeds scroll-padding-top, so focused elements and anchor targets land below the
    // header (WCAG 2.4.11). --site-header-offset is how much of the window the header covers right now,
    // which the sticky "In this article" rail sits beneath.
    function setTucked(tucked) {
        header.classList.toggle("is-tucked", tucked);
        root.style.setProperty("--site-header-offset", tucked ? "0px" : `${header.offsetHeight}px`);
    }

    function measure() {
        root.style.setProperty("--site-header-height", `${header.offsetHeight}px`);
        setTucked(header.classList.contains("is-tucked"));
    }

    measure();
    if ("ResizeObserver" in window) {
        new ResizeObserver(measure).observe(header);
    }

    // Keyboard focus only: a mouse click on the theme toggle shouldn't pin the header in place.
    function hasKeyboardFocus() {
        try {
            return !!header.querySelector(":focus-visible");
        } catch (e) {
            return header.contains(document.activeElement);
        }
    }

    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
        ticking = false;
        // Clamp to the scrollable range so overscroll bounce at either end doesn't flip the header.
        const maxY = Math.max(root.scrollHeight - window.innerHeight, 0);
        const y = Math.min(Math.max(window.scrollY, 0), maxY);
        if (Math.abs(y - lastY) < 8) return;

        // Stay in view near the top, while the menu is open, or while keyboard focus is inside the header.
        const scrollingDown = y > lastY;
        setTucked(scrollingDown && y > header.offsetHeight && !isMenuOpen() && !hasKeyboardFocus());
        lastY = y;
    }

    window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(onScroll);
    }, { passive: true });

    // Tabbing back into a tucked header brings it into view.
    header.addEventListener("focusin", function () {
        setTucked(false);
    });
});
