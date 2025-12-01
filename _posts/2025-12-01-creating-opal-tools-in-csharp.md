---
layout: post
title: "Creating Opal Tools Using The C# SDK"
description: "Creating Opal Tools using the Optimizely.Opal.Tools C# SDK."
permalink: "/article/creating-opal-tools-in-csharp"
category:
  - Development
  - Optimizely
relatedArticles:
  - "_posts/2025-09-28-creating-opal-tools-for-stott-robots-handler.md"
---

Over the last few months, my colleagues at Netcel and I have partaken in two different challenge events organised by Optimizely and centered around Opal.  Opal is Optimizely’s agentic marketing AI, deeply integrated across the Optimizely One platform. What transforms Opal from a conversational assistant into a true content-orchestration engine is its use of Agents, Workflows and Opal Tools. Opal tools are APIs that allow Opal to perform functional tasks that would otherwise fall outside the AI’s native capabilities. Throughout August, our teams were looking at building Opal Tools as part of the Optimizely Opal Hackathon.  Throughout November we took part in the Opal Innovation Challenge which saw us leveraging new capabilities using Opal Tools, Specialized Agents, Instructions and Workflows.

Optimizely currently provides SDKs in three languages for building Opal Tools: C#, JavaScript, and Python.  For C#, Optimizely offers two separate SDKs: **OptimizelyOpal.OpalToolsSDK** and **Optimizely.Opal.Tools**. At the time of writing, the documentation and training materials primarily reference **OptimizelyOpal.OpalToolsSDK**, which only reached version 0.1.0 in May 2025. In contrast, **Optimizely.Opal.Tools** appears to be receiving more active development, with version 0.4.0 being released in September 2025.

Both C# SDKs can deliver Opal tools, we used **OptimizelyOpal.OpalToolsSDK** as part of the Hackathon and **Optimizely.Opal.Tools** as part of the innovation challenge.  There are some differences in terms of capabilities for both SDKs which are as follows:

| Feature | OptimizelyOpal.OpalToolsSDK | Optimizely.Opal.Tools |
|:-|:-:|:-:|
| Discovery API | &#x2714; | &#x2714; |
| Tools API | &#x2714; | &#x2714; |
| Supports Tool Authentication | &#x2714; | &#x2714; |
| Supports Dependency Injection | &#x2718; | &#x2714; |
| Supports Island Functionality | &#x2718; | &#x2714; |

While there isn't a lot between them and both are pre-version 1.x, **Optimizely.Opal.Tools** is the stronger and more flexible offering.

## Getting Started With Building Opal Tools

This guide assumes you are familiar with C# and creating basic web applications. In your IDE of choice, create a new C# Web API project and install the [Optimizely.Opal.Tools](https://www.nuget.org/packages/Optimizely.Opal.Tools/) nuget package

### Creating a Tool

In this example, we’ll create a simple "Hello World" tool. Every Opal Tool **must** have a parameters class, which can contain zero or more properties. Start by creating a new class with a single property named FirstName. If you decorate the property with the **[Required]** attribute, Opal will know that this parameter must always be provided. You should also add a **[Description]** attribute to help Opal understand the purpose of the property. Clear descriptions improve Opal’s ability to supply correct values.

```C#
public class HelloWorldParameters
{
    [Required]
    [Description("The first name of the person to greet.")]
    public string FirstName { get; set; } = string.Empty;
}
```

Next, create a class that serves as the entry point for your tool. Add a public method that returns either an **object** or **Task\<object\>** if your code can run asynchronously. Decorate the method with the **[OpalTool]** attribute to declare the tool’s name (using snake_case or kebab-case) and the **[Description]** attribute to explain when and how Opal should use it. Whatever you return must be serializable to JSON.

```C#
public class HelloWorldTools(IHelloWorldService service)
{
    [OpalTool("say-hello-world")]
    [Description("Says hello based on a provided first name")]
    public object HelloWorld(HelloWorldParameters parameters)
    {
        return new
        {
            Message = service.SayHello(parameters.FirstName)
        };
    }
}
```

Here we’re using **dependency injection** to provide an **IHelloWorldService**. This is supported only in the **Optimizely.Opal.Tools** SDK. You could also return a concrete type, but an anonymous object keeps the example simple.

Now set up your tools in Program.cs or Startup.cs. The **AddOpalToolService()** extension registers the tool infrastructure and must be called before registering any tools. Then call **AddOpalTool\<ToolClass\>()** for each tool class. Finally, use **MapOpalTools()** to make the endpoints available in the request pipeline:

```C#
var builder = WebApplication.CreateBuilder(args);

// Register tool dependencies:
builder.Services.AddScoped<IHelloWorldService, HelloWorldService>();

// Register Opal Tool Service and Tools
builder.Services.AddOpalToolService();
builder.Services.AddOpalTool<HelloWorldTools>();

var app = builder.Build();

// Add the Opal tools into the HTTP request pipeline
app.MapOpalTools();

app.Run();
```

### Testing Your Tools

Because Opal Tools are invoked by Opal itself, the only way to test them locally is through API testing tools such as **Postman** or **HTTP** files. HTTP files allow you to version-control your test requests and run them directly from your IDE.

- In VS Code, install the [REST Client extension by Huachao Mao](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) to enable this functionality.
- In Visual Studio, you’ll need version 17.14.19 or later, which offers proper HTTP-file support, including authorization headers.

Here is an example HTTP file for testing both the discovery endpoint and the tool endpoint. Your IDE will render a "Send Request" link above each request:

```HTTP
### Variables for all tools
@Tools_HostAddress = https://localhost:8000
@token = dev-token-value
###

### 1. Tool Discovery Endpoint
GET {{Tools_HostAddress}}/discovery
Accept: application/json
###

### 2. Say Hello

POST {{Tools_HostAddress}}/tools/say-hello-world
Accept: application/json
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "parameters": {
    "FirstName": "Mark"
  }
}

###
```

Executing the discovery endpoint from the HTTP file should provide the following response:

```json
{
  "functions": [
    {
      "name": "say-hello-world",
      "description": "Says hello based on a provided first name",
      "parameters": [
        {
          "name": "FirstName",
          "type": "string",
          "description": "The first name of the person to greet.",
          "required": false
        }
      ],
      "endpoint": "/tools/say-hello-world",
      "auth_requirements": [],
      "http_method": "POST"
    }
  ]
}
```

Executing the tool endpoint should produce the following response:

```JSON
{
  "message": "Hello Mark"
}
```

You’ll notice that the tool endpoint uses an **Authorization** header, while the discovery endpoint does not. This is because the discovery endpoint must allow anonymous access. Tool endpoints, however, may require a **bearer token**. Note that this token must be static and shared by all tools within the same application, as it’s provided during the tool registration process within Opal.

Because the SDK controls the mapping of tool endpoints, you cannot apply individual **[Authorize]** attributes to them. If you want to require bearer-token authentication then you’ll need to implement custom middleware. That middleware should intercept requests whose path begins with **/tools/** and validate that a bearer token is present (and valid) before allowing the request to proceed:

```C#
public sealed class ToolAuthenticationMiddleware
{
    private readonly RequestDelegate _next;

    public ToolAuthenticationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Check if the request is for a tool endpoint
        if (context.Request.Path.StartsWithSegments("/tools"))
        {
            // Validate that the Authorization header is present and valid...
            if (!context.Request.Headers.TryGetValue("Authorization", out var authHeader) || !IsValidToken(authHeader))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Unauthorized");
                return;
            }
        }

        await _next(context);
    }

    private bool IsValidToken(string authHeader)
    {
        // Validate the bearer token value here...
    }
}
```

### Adding Authentication to a Tool

The bearer token discussed earlier is used solely to secure communication between Opal and your tool’s endpoint. It does not represent the identity of the Opal user. However, there are scenarios where your tool needs to operate in the context of the authenticated user who initiated the request. To support this, Optimizely Opal can pass user authentication data to Opal Tools.

At the time of writing, the only supported authentication provider is "OptiId". If your discovery endpoint includes a tool that references an unsupported provider, Opal will fail to process the discovery response. During initial tool registration, Opal provides feedback indicating that the provider is unsupported. However, if the tool has already been registered and you are syncing updates, Opal will return a success response but silently skip the update; something that can be quite misleading.

Let’s create a new tool that requires user authentication. To do this, you must apply the **[OpalAuthorization]** attribute to the method, specifying the provider ("OptiId"), the scope bundle, and whether authentication is mandatory. The method signature should include both a custom parameters object (as in earlier examples) and an instance of **OpalToolContext**, which contains the user’s authentication data and additional request context.

```C#
[OpalTool("test-auth")]
[Description("A tool to test auth")]
[OpalAuthorization("OptiId", "cms", true)]
public object TestAuthorization(AuthenticationTestParameters parameters, OpalToolContext context)
{
    return new
    {
        Provider = context?.AuthorizationData?.Provider,
        Details = context?.AuthorizationData?.Credentials,
        EmailAddress = parameters?.EmailAddress
    };
}

public class AuthenticationTestParameters
{
    [Description("The email address of the current opal user making this request.")]
    [Required]
    public string EmailAddress { get; set; } = string.Empty;
}
```

When inspecting the discovery endpoint for this tool, you’ll notice that the **auth_requirements** property is an array. This is intentional as Optimizely intends for Opal to support multiple authentication schemes for a single tool. If you want a tool to accept more than one provider, simply apply multiple **[OpalAuthorization]** attributes to the method.

```JSON
{
  "functions": [
    {
      "name": "test-auth",
      "description": "A tool to test auth",
      "parameters": [
        {
          "name": "EmailAddress",
          "type": "string",
          "description": "The email address of the current opal user making this request.",
          "required": true
        }
      ],
      "endpoint": "/tools/test-auth",
      "auth_requirements": [
        {
          "provider": "OptiId",
          "scope_bundle": "cms",
          "required": true
        }
      ],
      "http_method": "POST"
    }
  ]
}
```

When Opal executes this tool, it sends the request body (shown below) to your endpoint.  Notice that we decorated **AuthenticationTestParameters.EmailAddress** with a **[Description]** attribute of _"The email address of the current Opal user making this request."_.  Opal understands this description and will populate **parameters.EmailAddress** automatically based on the current user without any intervention being needed.  This really highlights the ability for Opal to infer, supply, and validate contextual user data without intervention from the user or the tool.  It can also give you a means to feed back to the user asynchronously using email.

```JSON
{
  "parameters": {
    "EmailAddress": "jo.bloggs@example.com"
  },
  "auth": {
    "provider": "OptiID",
    "credentials": {
      "token_type": "Bearer",
      "access_token": "<access-token-1446-chars>",
      "org_sso_id": "<id>",
      "cfg_client_id": "",
      "user_id": "<guid-no-hyphens>",
      "instance_id": "<guid-no-hyphens>",
      "customer_id": "<guid-no-hyphens>",
      "product_sku": "OPAL"
    }
  },
  "environment": {
    "execution_mode": "interactive"
  },
  "chat_metadata": {
    "thread_id": "<guid>"
  }
}
```

## Summary

In this article, we explored how to build Opal Tools with the **Optimizely.Opal.Tools** SDK, define parameters, handle authentication, and secure tool endpoints. You should now have a clear understanding of how Opal discovers, registers, and executes tools, as well as how user and bearer authentication data flow into your tool methods. With these fundamentals, you’re ready to create secure, functional tools that extend Opal’s capabilities.