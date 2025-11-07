document.addEventListener("DOMContentLoaded", function () {

    function toggleCertifications() {
        const otherCerts = document.querySelectorAll(".js-other-cert");
        const toggleIcon = document.getElementById("certToggleIcon");
        const toggleText = document.getElementById("certToggleText");
        let isHidden = otherCerts[0].classList.contains("d-none");
        
        // Toggle the always-hidden certifications
        otherCerts.forEach(cert => {
            if (isHidden) {
                cert.classList.remove("d-none");
            } else {
                cert.classList.add("d-none");
            }
        });

        // Toggle the responsive certifications for smaller screens
        const secondCerts = document.querySelectorAll(".js-second-cert");
        secondCerts.forEach(cert => {
            if (isHidden) {
                cert.classList.remove("d-sm-block");
            } else {
                cert.classList.add("d-sm-block");
            }
        });

        const thirdCerts = document.querySelectorAll(".js-third-cert");
        thirdCerts.forEach(cert => {
            if (isHidden) {
                cert.classList.remove("d-lg-block");
            } else {
                cert.classList.add("d-lg-block");
            }
        });

        // Toggle the icon between up and down chevrons
        if (isHidden) {
            // Showing more - change to up arrow
            toggleIcon.classList.remove("fa-chevron-down");
            toggleIcon.classList.add("fa-chevron-up");
            toggleText.textContent = "Show Fewer Certifications";
        } else {
            // Hiding - change to down arrow
            toggleIcon.classList.remove("fa-chevron-up");
            toggleIcon.classList.add("fa-chevron-down");
            toggleText.textContent = "Show More Certifications";
        }
    }

    // Add click event listener to the toggle button
    const toggleButton = document.getElementById("toggleCertifications");
    if (toggleButton) {
        toggleButton.addEventListener("click", toggleCertifications);
    }

});