---
layout: post
title: "Triggering Opal Workflows When Publishing Content"
description: "How to trigger Opal Workflows when publishing content in Optimizely CMS SaaS or PaaS."
permalink: "/article/triggering-opal-workflows-on-publish"
category:
  - Development
  - Optimizely
relatedArticles:
- "_posts/2025-09-28-creating-opal-tools-for-stott-robots-handler.md"
- "_posts/2025-12-03-creating-opal-tools-in-csharp.md"
---

Over the course of November, my colleagues at <a href="https://www.netcel.com/" target="_blank">Netcel</a> and I took part in Optimizely's Opal Innovation Challenge.  We were tasked to be inventive and to discover new ways in which we could use Opal with emphasis on Specialized Agents, Workflows and Tools.  If you are unaware of what these features are, my colleague <a href="https://www.linkedin.com/in/carrgraham/" target="_blank">Graham Carr</a> has written a great introduction blog entitled <a href="https://world.optimizely.com/blogs/allthingsopti/dates/2025/12/a-day-in-the-life-of-an-optimizely-omvp---optimizely-opal-specialized-agents-workflows-and-tools-explained/" target="_blank">A day in the life of an Optimizely OMVP - Optimizely Opal: Specialized Agents, Workflows, and Tools Explained</a>.

In this technical blog, I'm going to focus on how we can leverage publish events to trigger workflows within Opal.  The traditional method of doing this would be to leverage content events in **C#** by registering handlers for the **IContentEvents** interface.  This approach has the downside of only being applicable for **PaaS** solutions.  I will be showing you how to achieve the same goal using webhooks in **Content Graph** which has the advantage of being applicable to both **SaaS** and **PaaS** CMS without relying on CMS hosted event handlers.

>💡**Tip:** Optimizely is moving away from **Search & Navigation** to **Content Graph** for improved flexibility, stability and performance. Use add-ons such as <a href="https://world.optimizely.com/blogs/allthingsopti/dates/2025/12/a-day-in-the-life-of-an-optimizely-omvp---optigraphextensions-v2.0-enhanced-search-control-with-language-support-synonym-slots-and-stop-words" target="_blank">OptiGraphExtensions</a> to manage your synonyms in **Content Graph**.

## Solution Flow

Optimizely Content Graph has webhook functionality that will allow you to subscribe to indexing events.  If you're developing headless solutions with Content Graph you should already be familiar with this functionality.  For this solution the data journey will be as follows:

- User publishes a page or experience in the CMS
- The content changes are indexed into Content Graph
- Content Graph will send a notification to an Integration API using webhooks
- The Integration API will retrieve additional information from Content Graph
- The Integration API will package the data up and send it to a webhook endpoint in Optimizely Opal

![Sequence diagram for the CMS to Opal Workflow integration](/assets/cms-to-opal-sequence-diagram.png)

You might ask why there is an Integration API included here? This is because Content Graph webhooks intentionally provide minimal payloads, which keeps them fast and reliable but requires enrichment downstream.

## Testing Webhooks in Third Party Systems

Testing Webhook responses can be a challenge, especially if you are unsure what real data is going to look like.  This is where tools such as <a href="https://webhook.cool/" target="_blank"><strong>Webhook</strong>Cool</a> come in.  This particular website provides you with a temporary end point that you can point your webhook at so that you can examine your data before implementing an endpoint.  I've found this particular tool to be very helpful during the prototyping phases.

> 🔒 **Security Warning:** Third party tools like WebhookCool can be useful for testing APIs, however you should **never** use them with a production environment or anything that might contain PII data.

## Creating Webhooks In Content Graph

A webhook can be registered with Content Graph using a POST request.  This POST request will require authorization using Basic or HMAC Authentication. In this example I am registering the webhook using Basic Authentication with the following key pieces of information:

- The **request** contains the URL and method for the webhook.
- The **topic** is set to be "doc.updated", this tells Content Graph we are only interested in single document update events.
- The **filter** is set to filter content to published items only.

```JSON
POST https://cg.optimizely.com/api/webhooks
Content-Type: application/json
Authorization: Basic <Base64 encoded App Key and Secret>

{
    "request" : {
        "url" : "https://webhook.cool/at/randomly-generated-name",
        "method": "post"
    },
    "topic": ["doc.updated"], 
    "filters": [
        {
            "status": { "eq": "Published" }
        }
    ]
}
```

When you update the content item in Content Graph you will get one or more webhook events being executed with a response like so:

```JSON
{
  "timestamp": "2025-12-22T13:56:00.7410789+00:00",
  "tenantId": "00000000000000000000000000000000",
  "type": {
    "subject": "doc",
    "action": "updated"
  },
  "data": {
    "docId": "662e2c97-c658-497d-a998-1c00df22e600_en_Published"
  }
}
```

Out of the box this isn't ready for consumption for Opal as this doesn't contain any information about the updated page beyond the docId which is a unique identifier within graph for the content item.  If you wanted to pass something more useful to Opal, like a URL, then you will need an Integration API end point to handle this.

>💡**Tip:** Please note that webhooks are registered per CMS and Content Graph environment, typically these are Integration, Preproduction and Production. However, there is only one Opal instance and you may not want events raised during QA or UAT to burn through your Opal credits.

## Creating The Integration API

> 🔒 **Please Note:** identifiers in these examples have been swapped out with a randomly generated id to aid visualization and should not reflect any specific system.

The first thing we will need is to convert the Content Graph docId into data we can use to filter graph queries.  This requires us to split the docId based on underscores with the first component being the Content GUID, the second being the language for the content and the third being the published state.  To make matters more interesting, the Content GUIDs are stored without hyphens in Content Graph, so we have to strip those out too:

```C#
public bool TryConvertContentIdentifiers(string docId, out string id, out string locale)
{
    id = string.Empty;
    locale = string.Empty;
    if (string.IsNullOrWhiteSpace(docId))
    {
        return false;
    }

    var components = docId.Split('_');
    if (components.Length < 2 || !Guid.TryParse(components[0], out _) || string.IsNullOrWhiteSpace(components[1]))
    {
        return false;
    }

    id = components[0].Replace("-", string.Empty);
    locale = components[1];
    return true;
}
```

This will essentially turn `662e2c97-c658-497d-a998-1c00df22e600_en_Published` into `662e2c97c658497da9981c00df22e600` and `en`.  We can then use these to request URL data from Content Graph with our query looking like:

```graphql
query MyQuery {
  _Page(
    orderBy: { _modified: DESC }
    where: {
      _metadata: { key: { eq: "662e2c97c658497da9981c00df22e600" }, locale: { eq: "en" } }
    }
  ) {
    items {
      _id
      _metadata {
        url {
          base
          hierarchical
          default
        }
      }
    }
  }
}
```

This will have a response that looks like:

```JSON
{
  "data": {
    "_Page": {
      "items": [
        {
          "_id": "662e2c97-c658-497d-a998-1c00df22e600_en_Published",
          "_metadata": {
            "url": {
              "base": "https://www.example.com",
              "hierarchical": "/insights/",
              "default": "/insights/"
            }
          }
        }
      ]
    }
  },
  "extensions": { ... }
}
```

We can then wrap this up into a request to get the data from Content Graph by performing the following:

- Using a StringBuilder to create the query.
- Retrieving the data from Content Graph using single key authentication.
- Serializing the data onto an object model based on the example response above.
- Validating the URL data for each content item in the response

```C#
public async Task<List<Uri>> GetContentUris(string id, string locale)
{
    if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(locale))
    {
        return [];
    }

    // Build GraphQL Query to fetch content details
    var stringBuilder = new StringBuilder();
    stringBuilder.AppendLine("query MyQuery {");
    stringBuilder.AppendLine("  _Page(");
    stringBuilder.AppendLine("    orderBy: { _modified: DESC }");
    stringBuilder.AppendLine("    where: {");
    stringBuilder.AppendLine($"      _metadata: {%raw%}{{ key: {{ eq: \"{id}\" }}, locale: {{ eq: \"{locale}\" }} }}{%endraw%}");
    stringBuilder.AppendLine("    }");
    stringBuilder.AppendLine("  ) {");
    stringBuilder.AppendLine("    items {");
    stringBuilder.AppendLine("      _id");
    stringBuilder.AppendLine("      _metadata {");
    stringBuilder.AppendLine("        types");
    stringBuilder.AppendLine("        key");
    stringBuilder.AppendLine("        locale");
    stringBuilder.AppendLine("        published");
    stringBuilder.AppendLine("        url {");
    stringBuilder.AppendLine("          base");
    stringBuilder.AppendLine("          hierarchical");
    stringBuilder.AppendLine("          default");
    stringBuilder.AppendLine("        }");
    stringBuilder.AppendLine("      }");
    stringBuilder.AppendLine("    }");
    stringBuilder.AppendLine("  }");
    stringBuilder.AppendLine("}");

    // Get the data from Content Graph using a GET request using single key authentication
    var query = stringBuilder.ToString();
    var authKey = configuration.GetValue<string>("GraphSingleKey");
    var graphUri = new Uri($"https://cg.optimizely.com/content/v2?auth={authKey}&cg-roles=Content%20Editors&query={Uri.EscapeDataString(query)}");

    var httpClient = httpClientFactory.CreateClient();
    var response = await httpClient.GetAsync(graphUri);

    response.EnsureSuccessStatusCode();

    var content = await response.Content.ReadAsStringAsync();
    var contentResponse = JsonSerializer.Deserialize<ContentQueryResponseDto>(content)!;

    // Validate the results so we only return URLs that are valid absolute URLs.
    var pages = contentResponse?.Data?.Pages?.Items ?? [];
    var contentUris = new List<Uri>();
    foreach (var page in pages)
    {
        var contentUrl = $"{page.Metadata?.Url?.Base}{page.Metadata?.Url?.Hierarchical}";
        if (Uri.IsWellFormedUriString(contentUrl, UriKind.Absolute))
        {
            contentUris.Add(new Uri(contentUrl));
        }
    }

    return contentUris;
}
```

Now we have a means to transform the data from the Graph Webhook and to retrieve the URL data from Content Graph, we can use this inside of a C# Controller to do the following:

- Act as the endpoint for the Content Graph Webhook
- Retrieve the URLs for the updated content items from Content Graph
- Push each URL into the Opal Workflow Webhook

```C#
[HttpPost]
[Route("api/content/publish")]
[Consumes("text/plain", "application/json")]
public async Task<IActionResult> ContentPublishEvent([FromQuery] string apiKey)
{
    // [FromBody] attribute does not work with a content-type of text/plain.
    // So read the response body out manually and then deserialize it.
    WebhookEventDto? contentPublishEvent;
    using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
    {
        var body = await reader.ReadToEndAsync();
        if (string.IsNullOrWhiteSpace(body))
        {
            return BadRequest();
        }

        contentPublishEvent = JsonSerializer.Deserialize<WebhookEventDto>(body);
    }

    // Validate the request payload has the required data items
    if (string.IsNullOrWhiteSpace(contentPublishEvent?.Data?.DocId) || string.IsNullOrWhiteSpace(apiKey))
    {
        return BadRequest();
    }

    // Convert Identifiers from the Content Graph Webhook data into values to locate the item in Content Graph
    if (!TryConvertContentIdentifiers(contentPublishEvent.Data.DocId, out var id, out var locale))
    {
        return BadRequest();
    }

    // Get Page Uris from Content Graph
    var pageUris = await GetContentUris(id, locale);

    // Send Page Uri's to the Opal Workflow Webhook
    foreach (var pageUri in pageUris)
    {
        await PostAsync(opalUri, new { url = pageUri.ToString() });
    }

    return Ok();
}

public async Task PostAsync<TRequest>(string url, TRequest requestBody)
{
    var httpClient = httpClientFactory.CreateClient();
    var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
    var response = await httpClient.PostAsync(url, jsonContent);
    
    response.EnsureSuccessStatusCode();
}
```

Keen observers may note that the controller is configured to accept both **text/plain** and **application/json** payloads. In practice, Content Graph webhooks can deliver requests with a **text/plain** MIME type, while tools such as HTTP files or Postman typically send payloads as **application/json**. Since standard C# model binding does not run for requests with a **text/plain** content type, the request body is read and deserialized manually within the controller.

The end result of this integration API is that content update actions for non-pages will be ignored and Opal will only recieve an instruction to run a workflow for publicly accessible pages with a provided URL in a simple payload: 

```JSON
{ 
  "url": "https://www.example.com/insights/"
}
```

## Creating the Workflow in Opal

A workflow in Optimizely Opal is a collection of one or more specialized agents that can perform a set of actions either as a direct result of a chat prompt or independently from the chat prompt based on triggers.  One of these triggers is a Webhook trigger.  In order to create a new Opal Workflow you will need to do the following:

- Login to Opal at <a href="https://opal.optimizely.com/" target="_blank">https://opal.optimizely.com/</a>
- Click on Agents in the left-hand menu
- Click on the "Add Agent" drop-down CTA
- Click on "Workflow Agent"
- Enter a name and unique id for the agent
- Click on "Edit Workflow"

At this point you should have the workflow editor screen showing, this is a drag and drop interface that allows you to add triggers, logic gates and agents and to link them together.

![A screenshot of the workflow editor interface](/assets/opal-workflow-webhook.png)

In this example I have created a new workflow trigger and set the payload so that it knows to expect a simple JSON object containing a URL.  I have also given the workflow a chat trigger and a chain of two specialized agents.  When you save your workflow trigger for the first time, the Webhook URL is automatically generated using the following format:

```
https://webhook.opal.optimizely.com/webhooks/<instance-id>/<webhook-trigger-id>
https://webhook.opal.optimizely.com/webhooks/abcdef0123456789abcdef0123456789/abcdef01-2345-6789-abcd-ef0123456789
```

This Webhook URL is what will be referenced by our Integration API.

## End to End

Now we have all the components needed to bring the solution flow together by performing the following:

- Creating the Opal Workflow Webhook.
- Deploying the Integration API and configuring environment variables:
  - Content Graph Single Key: For public content graph consumption and retrieval of page meta data.
  - Opal Workflow Url: So that the Integration API can send payloads to the Opal Workflow
- Register the Content Graph Webhook: So that content update events are sent to the Integration API

This approach allows content publishing in Optimizely CMS to automatically trigger AI-driven workflows in Optimizely Opal, regardless of whether the CMS is hosted on SaaS or PaaS. Content Graph provides lightweight publish events, the Integration API enriches those events with a public URL, and Opal executes a workflow using a simple, stable webhook payload.

Within Opal, you can then configure the workflow to orchestrate a chain of specialized agents, each focused on a specific responsibility. Because agents receive only a URL, they remain decoupled from CMS internals and can evolve independently over time.

Typical agents in this workflow might include:
- Automated GEO Recommendations – analysing content structure and semantics to improve visibility in AI-driven search and generative experiences.
- Automated SEO Assessment – evaluating headings, metadata, internal linking, and page structure to surface actionable optimisation insights.
- Automated Brand Assessment – checking tone, messaging, and consistency against brand guidelines at publish time.

By combining these agents into a single workflow, teams can receive immediate, automated feedback on published content, reducing manual review effort while keeping the integration scalable, flexible, and CMS-agnostic.

### Other Considerations

When building integrations like this, it’s important to consider security and resilience from the outset. As part of this solution, you should consider the following best practices:

- Protect the Integration API
  - Register the Content Graph webhook with an API key passed via the query string and validate it in the Integration API.
  - This helps prevent unauthorised requests if the endpoint URL is discovered.
- Secure the Opal Workflow webhook
  - Configure the authorization parameters on the Opal Workflow webhook trigger.
  - Ensure the Integration API includes the required authorization details when invoking the workflow.
  - This prevents third-party actors from triggering workflows if the webhook URL is exposed.
- Harden the Integration API
  - Implement structured logging to support monitoring and diagnostics.
  - Add robust error handling and validation.
  - Use retry mechanisms to handle transient failures when calling external services.
  - Apply brute-force and rate-limiting protections to reduce abuse risk.

## References

- <a href="https://docs.developers.optimizely.com/platform-optimizely/docs/manage-webhooks">Optimizely Developer Documentation - Content Graph - Manage Webhooks</a>
- <a href="https://world.optimizely.com/blogs/allthingsopti/dates/2025/12/a-day-in-the-life-of-an-optimizely-omvp---optimizely-opal-specialized-agents-workflows-and-tools-explained/" target="_blank">A day in the life of an Optimizely OMVP - Optimizely Opal: Specialized Agents, Workflows, and Tools Explained</a>.
- <a href="https://webhook.cool/" target="_blank"><strong>Webhook</strong>Cool</a>