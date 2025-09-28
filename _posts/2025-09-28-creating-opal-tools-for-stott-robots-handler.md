---
layout: post
title: "Creating Opal Tools for Stott Robots Handler"
description: "An approach to creating Optimizely Opal Tools without using the SDKs."
permalink: "/article/creating-opal-tools-for-stott-robots-handler"
category:
  - Development
  - Optimizely
  - "Stott Robots Handler"
relatedArticles:
  - "_posts/2025-09-17-stott-robots-handler-v6.md"
  - "_posts/2025-09-19-helping-opal-build-llms-txt-content.md"
---

This summer, the Netcel Development team and I took part in Optimizely's Opal Hackathon.  The challenge from Optimizely was to extend Opal's abilities by creating tools that would wrap actual business flows allowing Opal to focus on inputs and outputs in a conversational context.  Our initial submission was to develop event management tooling that would integrate with Optimizely SAAS Content Management System, Optimizely Content Management Platform and Eventbrite.

Optimizely has created SDKs in C#, JavaScript and Python to accelerate the process of developing Opal Tools, we opted to use the C# SDK due to language familiarity. This SDK required us to create static classes and methods that performed the tool actions while the SDK itself managed the routing for the tools and provided the discovery endpoint in its entirety. After delivering several tools for the hackathon I reflected on the SDK and how it was achieving our goals.  As the routing was managed by the SDK, it really limited our ability to create our own controllers or to consider other hosting options such as Azure Functions.  As the owner and maintainer of two Optimizely Add-ons I started to think about how this could work with PaaS CMS Add-ons.

I concluded that if I wanted to add Opal tools to my Add-ons that I would have to consider not using the SDK at all for the following reasons:

- To avoid conflict with CMS Implementations that have tools as part of their delivery.
- To avoid conflict with other CMS Add-ons that also attempted to use the SDK.
- To keep Discovery and Tool endpoints in the same routing structure as the rest of my Add-on.
- To apply custom bearer token validation and controller responses.

## Opal Tool Requirements

When we consider that Opal Tools are simply REST APIs with a specific JSON requirement, we realise that this is something we have been delivering for years. There are essentially two flavours of endpoint; the discovery endpoint which describes your tools to Opal and then your tool endpoints themselves.

### Discovery Endpoint

The discovery endpoint must return a JSON object containing an array of functions.  Each function in this array describes a tool as below. Each entry must specify a name, description, endpoint, an array of parameters and a desired HTTP method.  The description is especially important here as it will help Opal understand the scope and intent of your tool, getting this right is essential.

- **name**: This is the name of your tool and should be all one word and unique.
- **description**: This description will help Opal understand the intent for your tool, it's important that this is meaningful.
- **parameters**: This is a list of parameters Opal should send to your endpoint.
  - **name**: This is the name of the parameter, this should match the case you expect to receive the data on.
  - **description**: This description will help Opal understand how and what it should pass into this parameter.
  - **type**: This tells Opal what type of data it should send you.
  - **required**: This tells Opal if it should or could provide this parameter.
- **endpoint**: This should be the endpoint for your API and **must** be relative to the **discovery** endpoint.
- **http_method**: This tells Opal what HTTP method to use.
- **auth_requirements**: This is an **optional** field and can be entirely omitted.  Only populate this if you need an authentication to run your tool either from Opal or another identity provider.
  - **provider**: The name of the identity provider.
  - **scope_bundle**: The permission scope requested.
  - **required**: An indicator as to whether this authentication method is required or not.

**GET: /discovery**
```json
{
    "functions": [
        {
            "name": "myuniquetoolname",
            "description": "This is a description of what this tool will do.",
            "parameters": [
                {
                    "name": "parameterOne",
                    "type": "string",
                    "description": "A description of what data should be passed into this parameter.",
                    "required": false
                }
            ],
            "endpoint": "/tools/tool-api-endpoint",
            "http_method": "POST",
            "auth_requirements": [
                {
                    "provider": "OptiID",
                    "scope_bundle": "tasks",
                    "required": true
                }
            ]
        }
    ]
}
```

> 💡 **Tip:** Opal will not include the Authorization header when making a request to the discovery endpoint, so make sure your implementation is accessible anonymously.

### Tool Endpoint

The endpoint for a tool must be relative to the discovery endpoint, i.e. it must exist beneath the discovery endpoint.  If we assume that the discovery endpoint responds on `https://www.example.com/path-one/discovery`, and a tool has an endpoint of `/tools/tool-one` then Opal will send the request to `https://www.example.com/path-one/tools/tool-one`.  It should be noted that if you register the  with a trailing slash like `https://www.example.com/path-one/discovery/`, then Opal will send the request to `https://www.example.com/path-one/discovery/tools/tool-one` instead.  Because of this, you may want to check on any redirect rules within your solution that force trailing slashes etc.

- **parameters**: This will be a JSON object that has properties matching the defined tool parameters.
  - **parameterOne**: This is just an example parameter; your own parameters defined in the discovery endpoint will appear here.
- **auth**: This is an optional object and will only be provided if the tool has been specified as requiring a specific authentication.
  - **provider**: This will be the name of the authentication provider.
  - **credentials**: These are the specific authentication details.

Additional data items are also included as **environment** and **chat_metadata**, but these are not essential for the operation of your tool and could be useful in tracing operations.  In the following example, a tool has been declared as having OptiId as an authentication requirement. 

**POST: /tools/tool-name**
```json
{
	"parameters": {
		"parameterOne": "Some value"
	},
	"auth": {
		"provider": "OptiID",
		"credentials": {
			"token_type": "Bearer",
			"access_token": "...",
			"org_sso_id": null,
			"user_id": "...",
			"instance_id": "...",
			"customer_id": "...",
			"product_sku": "OPAL"
		}
	},
	"environment": {
		"execution_mode": "interactive"
	},
	"chat_metadata": {
		"thread_id": "e597710c-2d10-4f07-9817-6fad9f2b748d"
	}
}
```

## Implementing Opal Tools

Implementing the discovery endpoint itself is a simple.  The C# SDK for example uses reflection and understands the attributes you decorate on your tools.  As I'm not using an SDK in this scenario I could either ship a JSON object with my code, or in this case create the classes that achieve the same outcome.  I opted to create the DTO objects that would be serialized into the desired JSON structure.  I decorated the controller action with the `HttpGet` and `AllowAnonymous` attributes to ensure that the endpoint was publicly accessible for GET requests only.

```C#
[HttpGet]
[AllowAnonymous]
[Route("/stott.robotshandler/opal/discovery/")]
public IActionResult Discovery()
{
    var model = new FunctionsRoot { Functions = new List<Function>() };

    model.Functions.Add(new Function
    {
        Name = "getrobottxtconfigurations",
        Description = "Get a collection of robot.txt configurations optionally filtered by host name.",
        Parameters = new List<FunctionParameter>
        {
            new FunctionParameter
            {
                Name = "hostName",
                Type = "string",
                Description = "The host name to filter the robot.txt configurations by.",
                Required = false
            }
        },
        Endpoint = "/tools/get-robot-txt-configurations/",
        HttpMethod = "POST"
    });

    // More tools defined here...

    return CreateSafeJsonResult(model);
}
```

As I was aiming to support multiple endpoints with the same model structure, I used generics to create a wrapping object using the specific content model required by my endpoint.  This is then added as a parameter to my controller actions with the `FromBody` attribute to ensure the model was pulled from the request body.  Note that it is worth specifying the `JsonPropertyName` attributes as you cannot guarantee the serialization options of the hosting solution.

```csharp
public class ToolRequest<TModel> where TModel : class
{
    [JsonPropertyName("parameters")]
    public TModel Parameters { get; set; }
}

public class GetRobotTextConfigurationsQuery
{
    [JsonPropertyName("hostName")]
    public string HostName { get; set; }
}
```

If your tool needs to have authentication passed into it, then you can extend this wrapping object to contain the authentication data like so:

```csharp
public class AuthenticatedToolRequest<TModel> where TModel : class
{
    [JsonPropertyName("parameters")]
    public TModel Parameters { get; set; }

    [JsonPropertyName("auth")]
    public AuthData Auth { get; set; }
}

public class AuthData
{
    [JsonPropertyName("provider")]
    public string Provider { get; set; } = string.Empty;

    [JsonPropertyName("credentials")]
    public Dictionary<string, object> Credentials { get; set; } = new Dictionary<string, object>();
}
```

In the following example, I have decorated my controller with the `HttpPost` attribute and then two separate `Route` attributes.  This helps my controller respond to both possible request paths, depending on whether the discovery endpoint was registered with a trailing slash or not.  I have then used the generic `ToolRequest<T>` class to wrap my specific model of `GetRobotTextConfigurationsQuery` as the parameter for the method.

```C#
[HttpPost]
[Route("/stott.robotshandler/opal/tools/get-robot-txt-configurations/")]
[Route("/stott.robotshandler/opal/discovery/tools/get-robot-txt-configurations/")]
[OpalAuthorization(OpalScopeType.Robots, OpalAuthorizationLevel.Read)]
public IActionResult GetRobotTxtConfigurations([FromBody] ToolRequest<GetConfigurationsQuery> model)
{
    try
    {
        var configurations = _service.GetAll();
        if (!string.IsNullOrWhiteSpace(model?.Parameters?.HostName))
        {
            var hostName = model.Parameters.HostName.Trim();
            var specificConfiguration =
                configurations.FirstOrDefault(x => string.Equals(x.SpecificHost, hostName, StringComparison.OrdinalIgnoreCase)) ??
                configurations.FirstOrDefault(x => x.AvailableHosts.Any(h => string.Equals(h.HostName, hostName, StringComparison.OrdinalIgnoreCase)));

            if (specificConfiguration is null)
            {
                return Json(new
                {
                    Success = false,
                    Message = $"Could not locate a robots.txt config that matched the host name of {model.Parameters.HostName}."
                });
            }

            return Json(ConvertToModel(specificConfiguration, hostName, x => x.RobotsContent));
        }

        return Json(ConvertToModels(configurations, x => x.RobotsContent));
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "An error was encountered while processing the robot-txt-configurations tool.");
        throw;
    }
}
```

You may have noticed that my controller action also has an **OpalAuthorization** attribute. When you register your tools in Opal with the discovery endpoint, you have the option to provide a bearer token that will be sent in an Authorization header.   This is a custom attribute that checks for the presence of an Authorization header with a bearer token and checks it against a user defined bearer token within my Add-on.  In my Add-on I allow the user to define multiple bearer tokens with different read/write permissions like so:

![A screenshot of the create new token modal](/assets/robots-handler-opal-tools-2.png)

## Wrapping Up

At the end of the day, Opal tools are just REST APIs with a specific JSON contract. Before you start building, it’s worth validating which official SDK (JavaScript, Python, or C#) best suits your project. They provide a quick path to getting up and running. If you find the SDK constraints don’t fit your use case, building your own endpoints without an SDK gives you full control over routing, authentication, and integration with your existing codebase. This makes it easier to plug tools into your Optimizely CMS or Add-ons without worrying about conflicts and to consider serverless hosting such as Azure Functions if you are deploying your tools separately.

If you’re a developer working with Optimizely, I’d encourage you to give this a try yourself. Start small: build a discovery endpoint, define a tool with one or two parameters, and watch Opal call it directly. Once you see it working end-to-end, you’ll have a solid foundation for building more advanced tools tailored to your projects.