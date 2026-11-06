// Gives each code block in an article a header bar with its language and an "Expand" button that opens
// the code in a full-screen view. Without this script the code blocks still scroll on their own.
document.addEventListener("DOMContentLoaded", function () {
    const blocks = document.querySelectorAll(".prose div.highlighter-rouge, .prose > pre");
    if (!blocks.length || typeof HTMLDialogElement !== "function") return;

    const languageNames = {
        bash: "Bash",
        csharp: "C#",
        graphql: "GraphQL",
        html: "HTML",
        http: "HTTP",
        javascript: "JavaScript",
        json: "JSON",
        markdown: "Markdown",
        plaintext: "Plain text",
        powershell: "PowerShell",
        typescript: "TypeScript",
        xml: "XML",
        yaml: "YAML"
    };

    function getLanguage(block) {
        const source = block.matches("pre") ? block.querySelector("code") || block : block;
        const match = Array.from(source.classList).find(name => name.startsWith("language-"));
        if (!match) return "";
        const key = match.slice("language-".length);
        return languageNames[key] || key;
    }

    // One shared dialog for the whole page.
    const dialog = document.createElement("dialog");
    dialog.className = "code-dialog";
    dialog.setAttribute("aria-labelledby", "code-dialog-title");
    dialog.innerHTML =
        '<div class="code-dialog__bar">' +
        '<h2 id="code-dialog-title" class="code-dialog__title"></h2>' +
        '<button type="button" class="code-button code-dialog__close">Collapse</button>' +
        '</div>' +
        '<div class="code-dialog__body"></div>';
    document.body.appendChild(dialog);

    const dialogTitle = dialog.querySelector(".code-dialog__title");
    const dialogBody = dialog.querySelector(".code-dialog__body");
    let returnFocusTo = null;

    dialog.querySelector(".code-dialog__close").addEventListener("click", function () {
        dialog.close();
    });

    // Fires for the Collapse button and for the Escape key.
    dialog.addEventListener("close", function () {
        dialogBody.replaceChildren();
        if (returnFocusTo) {
            returnFocusTo.focus();
        }
    });

    blocks.forEach(function (block) {
        const pre = block.matches("pre") ? block : block.querySelector("pre");
        if (!pre) return;

        const language = getLanguage(block);
        const toolbar = document.createElement("div");
        toolbar.className = "code-toolbar";

        const label = document.createElement("span");
        label.textContent = language;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "code-button";
        button.textContent = "Expand";
        button.setAttribute("aria-label", language ? `Expand ${language} code` : "Expand code");

        toolbar.append(label, button);
        if (block.matches("pre")) {
            block.before(toolbar);
        } else {
            block.prepend(toolbar);
        }

        button.addEventListener("click", function () {
            returnFocusTo = button;
            dialogTitle.textContent = language ? `${language} code` : "Code";
            dialogBody.replaceChildren(pre.cloneNode(true));
            dialog.showModal();
        });
    });
});
