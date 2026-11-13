// WebMCP: exposes read-only site tools to AI agents working in the browser.
// See https://webmachinelearning.github.io/webmcp/. Browsers without the API skip this entirely.
(function () {
    // The spec puts the API on document; older Chrome builds exposed it on navigator.
    const modelContext = document.modelContext || navigator.modelContext;
    if (!modelContext || typeof modelContext.registerTool !== "function") return;

    const addons = ["stott-security", "stott-robots-handler"];

    async function getJson(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Request for ${url} failed with status ${response.status}.`);
        return response.json();
    }

    async function register(tool) {
        try {
            await modelContext.registerTool(tool);
        } catch (error) {
            console.warn(`WebMCP: could not register ${tool.name}`, error);
        }
    }

    register({
        name: "search_articles",
        title: "Search articles",
        description: "Search Mark Stott's articles on www.stott.pro about Optimizely CMS, .NET development, Stott Security and Stott Robots Handler. Every word of the query must appear in the title, description or categories. Returns up to 10 articles, newest first.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Words to look for, such as \"content security policy\" or \"opal\"." },
                category: { type: "string", description: "Optional category to filter by, such as Optimizely, Development, Stott Security or Stott Robots Handler." }
            },
            required: ["query"]
        },
        annotations: { readOnlyHint: true },
        execute: async function (input) {
            const words = String(input.query || "").toLowerCase().split(/\s+/).filter(Boolean);
            const category = String(input.category || "").toLowerCase();
            const articles = await getJson("/data/articles.json");

            return articles
                .filter((article) => {
                    const categories = (article.categories || []).map((name) => name.toLowerCase());
                    if (category && !categories.includes(category)) return false;
                    const text = `${article.title} ${article.description || ""} ${categories.join(" ")}`.toLowerCase();
                    return words.every((word) => text.includes(word));
                })
                .slice(0, 10);
        }
    });

    register({
        name: "get_addon_latest_version",
        title: "Get add-on version",
        description: "Get the latest version, release notes and guides for Mark Stott's Optimizely CMS add-ons, Stott Security and Stott Robots Handler, for CMS 12, CMS 13 or both.",
        inputSchema: {
            type: "object",
            properties: {
                addon: { type: "string", enum: addons, description: "The add-on to look up." },
                cmsVersion: { type: "integer", enum: [12, 13], description: "Optional Optimizely CMS major version. Leave it out to get both." }
            },
            required: ["addon"]
        },
        annotations: { readOnlyHint: true },
        execute: async function (input) {
            if (!addons.includes(input.addon)) throw new Error(`Unknown add-on. Use one of: ${addons.join(", ")}.`);
            const versions = await getJson(`/data/${input.addon}.json`);

            return input.cmsVersion
                ? versions.filter((version) => version.cmsVersion === Number(input.cmsVersion))
                : versions;
        }
    });
})();
