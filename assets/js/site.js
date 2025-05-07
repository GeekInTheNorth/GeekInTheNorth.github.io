document.addEventListener("DOMContentLoaded", function () {
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
        document.cookie = `${name}=${value}; ${expires}; path=/`;
    }

    // Check if cookie banner has been interacted with
    const cookieBanner = document.querySelector(".cookie-banner");
    const cookieBannerValue = getCookie("accept_cookies");
    if (cookieBannerValue === null) {
        // Show the cookie banner if the cookie is not set
        cookieBanner.classList.remove("d-none");
        cookieBanner.classList.add("d-inline");
    } else {
        // Hide the cookie banner if the cookie is set
        cookieBanner.classList.remove("d-inline");
        cookieBanner.classList.add("d-none");
    }

    // Check if the cookie exists and has a value of "1"
    const cookieValue = getCookie("accept_personalization");
    if (cookieValue === "1") {
        // Create a script tag
        const script = document.createElement("script");
        script.src = "https://cdn.optimizely.com/js/5709185699020800.js"; // Replace with the actual script URL
        script.type = "text/javascript";

        // Append the script tag to the head
        document.head.insertBefore(script, document.head.firstChild);
    }

    // Add event listener to the CTA button
    const cookieCTAButton = document.querySelector(".js-cookie-cta");
    if (cookieCTAButton) {
        cookieCTAButton.addEventListener("click", function () {
            // Set cookies
            setCookie("accept_cookies", "1", 365);
            const personalizationCheckbox = document.getElementById("acceptPersonalization");
            if (personalizationCheckbox && personalizationCheckbox.checked) {
                setCookie("accept_personalization", "1", 365);
            } else {
                setCookie("accept_personalization", "0", 365);
            }

            // Hide the cookie banner
            cookieBanner.classList.remove("d-inline");
            cookieBanner.classList.add("d-none");
        });
    }
});