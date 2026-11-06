// Cookie consent and Optimizely Web Experimentation.
// Loaded in <head> so a consenting visitor's Optimizely snippet is requested as early as possible.
(function () {
    // Stored in accept_cookies. Bump it when the consent choices change so every visitor is asked again;
    // version 2 replaced a banner whose personalisation switch was ticked by default.
    const consentVersion = "2";
    const optimizelyCookies = ["optimizelyEndUserId", "optimizelySession"];

    // Function to get a cookie value by name
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    // Function to set a cookie
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax${secure}`;
    }

    // Function to remove a cookie, including any copy set on the parent domain
    function deleteCookie(name) {
        const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        const parentDomain = window.location.hostname.replace(/^www\./, "");
        document.cookie = `${name}=; ${expired}`;
        document.cookie = `${name}=; ${expired}; domain=.${parentDomain}`;
    }

    // Helper to check query string
    function hasOptimizelyEditorParam() {
        return new URLSearchParams(window.location.search).get('optimizely_editor') === 'true';
    }

    function hasMadeChoice() {
        return getCookie("accept_cookies") === consentVersion;
    }

    function allowsPersonalization() {
        return hasMadeChoice() && getCookie("accept_personalization") === "1";
    }

    let optimizelyLoaded = false;

    // Function to inject the Optimizely script (once per page)
    function injectOptimizelyScript() {
        if (optimizelyLoaded) return;
        optimizelyLoaded = true;
        const script = document.createElement("script");
        script.src = "https://cdn.optimizely.com/js/5709185699020800.js";
        document.head.insertBefore(script, document.head.firstChild);
    }

    if (hasOptimizelyEditorParam() || allowsPersonalization()) {
        injectOptimizelyScript();
    }

    document.addEventListener("DOMContentLoaded", function () {
        const cookieBanner = document.querySelector("[data-cookie-banner]");
        if (!cookieBanner) return;
        let opener = null;

        // While the banner is open, reserve its height at the foot of the page so it never covers
        // the element with keyboard focus (WCAG 2.4.11). The CSS reads --cookie-banner-space.
        function reserveSpace() {
            const space = cookieBanner.hidden ? 0 : cookieBanner.offsetHeight + 32;
            document.documentElement.style.setProperty("--cookie-banner-space", `${space}px`);
        }

        function showBanner() {
            cookieBanner.hidden = false;
            reserveSpace();
        }

        function hideBanner() {
            cookieBanner.hidden = true;
            reserveSpace();
            // Reopened from "Cookie Settings": hand focus back rather than dropping it on the page.
            if (opener) {
                opener.focus();
                opener = null;
            }
        }

        if ("ResizeObserver" in window) {
            new ResizeObserver(reserveSpace).observe(cookieBanner);
        }

        function saveChoice(acceptPersonalization) {
            const hadPersonalization = allowsPersonalization();
            setCookie("accept_cookies", consentVersion, 365);
            setCookie("accept_personalization", acceptPersonalization ? "1" : "0", 365);
            hideBanner();

            if (acceptPersonalization) {
                injectOptimizelyScript();
            } else if (hadPersonalization) {
                // Consent withdrawn: clear Optimizely's cookies and reload without the script.
                optimizelyCookies.forEach(deleteCookie);
                window.location.reload();
            }
        }

        cookieBanner.querySelectorAll("[data-consent]").forEach(function (button) {
            button.addEventListener("click", function () {
                saveChoice(button.dataset.consent === "all");
            });
        });

        document.querySelectorAll(".js-cookie-settings").forEach(function (button) {
            button.addEventListener("click", function () {
                opener = button;
                showBanner();
                cookieBanner.querySelector("[data-consent]").focus();
            });
        });

        if (!hasMadeChoice()) {
            showBanner();
        }
    });
})();
