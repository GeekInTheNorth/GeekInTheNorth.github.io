// Copy buttons for install commands and code samples. Each [data-copy] button copies the
// [data-copy-text] element in its [data-copy-scope] and announces the result for screen readers.
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-copy]").forEach(function (button) {
        const scope = button.closest("[data-copy-scope]");
        const source = scope && scope.querySelector("[data-copy-text]");
        const status = scope && scope.querySelector("[data-copy-status]");
        if (!source) return;

        button.addEventListener("click", async function () {
            try {
                await navigator.clipboard.writeText(source.textContent);
                if (status) status.textContent = "Copied to clipboard";
            } catch (e) {
                // Clipboard unavailable: select the text so it can be copied manually.
                window.getSelection().selectAllChildren(source);
                if (status) status.textContent = "Text selected, press Ctrl+C or Cmd+C to copy";
            }
        });
    });
});
