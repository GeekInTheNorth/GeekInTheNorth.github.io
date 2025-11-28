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

Opal is Optimizely’s marketing AI, deeply integrated across the Optimizely One platform. What transforms Opal from a conversational assistant into a true content-orchestration engine is its use of Opal Tools. These tools are APIs that allow Opal to perform functional tasks that would otherwise fall outside the AI’s native capabilities. Optimizely currently provides SDKs in three languages for building Opal Tools: C#, JavaScript, and Python.

For C#, Optimizely offers two separate SDKs: **OptimizelyOpal.OpalToolsSDK** and **Optimizely.Opal.Tools**. At the time of writing, the documentation and training materials primarily reference **OptimizelyOpal.OpalToolsSDK**, which only reached version 0.1.0 in May 2025. In contrast, **Optimizely.Opal.Tools** appears to be receiving more active development, with version 0.4.0 being released in September 2025.

Both C# SDKs can deliver Opal tools, but there are some differences:

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

In this example, we’ll create a simple "Hello World" tool. Every Opal Tool **must** have a parameters class, which can contain zero or more properties. Start by creating a new class with a single property named FirstName. If you decorate the property with the [Required] attribute, Opal will know that this parameter must always be provided. You should also add a [Description] attribute to help Opal understand the purpose of the property. Clear descriptions improve Opal’s ability to supply correct values.

```C#
public class HelloWorldParameters
{
    [Required]
    [Description("The first name of the person to greet.")]
    public string FirstName { get; set; } = string.Empty;
}
```

Next, create a class that serves as the entry point for your tool. Add a public method that returns either an **object** or **Task\<object\>** if your code can run asynchronously. Decorate the method with the **[OpalTool]** attribute to declare the tool’s name (using snake_case or kebab-case), and the **[Description]** attribute to explain when and how Opal should use it. Whatever you return must be serializable to JSON.

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

- In VS Code, install the [REST Client extension by Huachao Mao](https://marketplace.visualstudio.com/items?itemName=humao.rest-client).
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
    "FirstName": "Bob"
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
  "message": "Hello Bob"
}
```

You’ll notice that the tool endpoint uses an **Authorization** header, while the discovery endpoint does not. This is because the discovery endpoint must allow anonymous access. Tool endpoints, however, may require a **bearer token**. Note that this token must be static and shared by all tools within the same application, as it’s provided during the tool registration process within Opal.