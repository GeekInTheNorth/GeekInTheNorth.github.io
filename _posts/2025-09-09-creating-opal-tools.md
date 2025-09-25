---
layout: post
title: "Creating Opal Tools For Stott Robots Handler"
description: "An approach to creating Optimizely Opal Tools without using the SDKs."
permalink: "/article/creating-opal-tools"
category:
  - Development
  - Optimizely
---

# Creating Opal Tools For Stott Robots Handler

Published 9th September 2025

This summer, the Netcel Development team and I took part in Optimizely's Opal Hackathon.  The challenge from Optimizely was to extend Opal's abilities by creating tools that would wrap actual business flows allowing Opal to focus on inputs and outputs in a conversational context.  Our initial submissions was to develop event management tooling that would integrate with Optimizely SAAS Content Management System, Optimizely Content Management Platform and Eventbrite.

We developed these tools using the C# SDK provided by Optimizely.  This SDK required us to create static classes and methods that performed the tool actions while the SDK itself managed the rooting for the tools and provided the discovery endpoint in it's entirety. After delivering a number of tools for our hackathon I reflected back on the SDK and how it was achieving our goals.  As the routing was managed by the SDK, it really limited our ability create our own controllers or to consider other hosting options such as Azure Functions.  As the owner and maintainer of two Optimizely Add-Ons I started to think about how this could work with PAAS CMS AddOns.

I concluded that if I wanted to add Opal tools to my Add-Ons that I would have to consider not using the SDK at all for the following reasons:

- Avoids conflict with CMS Implementations that have tools as part of their delivery.
- Avoids conflict with other CMS Add-Ons that also attempted to use the SDK
- The Discover and Tool endpoints remain in the same routing structure as the rest of my add-on.

## Opal Tool Requirements

All that Opal effectively needs is a discovery endpoint that returns a specific JSON structure and a list of endpoints that accept a specific JSON structure and return any structure in return.

## Discovery Endpoint

The discovery endpoint JSON must contain a functions array which contains an entry for each tool.  Each tool must specify a name, description, an array of parameters, an endpoint relative to the discovery endpoint, a desired HTTP method and an optional array of auth_requirements.

**GET: /discovery**
```json

{
    "functions": [
        {
            "name": "getrobottxtconfigurations",
            "description": "Get a collection of robot.txt configurations optionally filtered by host name.",
            "parameters": [
                {
                    "name": "hostName",
                    "type": "string",
                    "description": "The host name to filter the robot.txt configurations by.",
                    "required": false
                }
            ],
            "endpoint": "/tools/get-robot-txt-configurations/",
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

A tool endpoint must accept a specific JSON structure containing the following properties:

- **parameters**: this will be a json object that has properties matching the defined tool parameters
- **auth**: this is an optional object and will only be provided if the tool has been specified as authentication requirements

Additional data items are also as **environment** and **chat_metadata** but these are not essential for the operation of your tool, but could be useful in tracing operations.  In the following example, a tool has been declared as having Opti Id as an authentication requirement. 

**POST: /tools/tool-name**
```json
{
	"parameters": {
		"parameterName": "parameter value"
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

Implementing the discovery endpoint itself is a simple solution.  I created a set of classes to represent the desired data structure and returned an entry for each API I was providing.  I decorated the controller action with the HttpGet and AllowAnonymous attributes to ensure that the endpoint was publically accessible for GET requests only.

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

As I was aiming to support multiple endpoints with the same model structure, I used generics to create a wrapping object using the specific content model required by my API.  This would then be added as a parameter for my endpoint methods with the FromBody attribute to ensure the model was pulled from the request body.

```csharp
public class ToolRequest<TModel> where TModel : class
{
    [JsonPropertyName("parameters")]
    public TModel Parameters { get; set; }
}

public class GetRobotTextConfigurationsQuery
{
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

When Opal resolves the URL for your tool, it resolves the path as being relative to the provided discovery endpoint.  If you provide the URL to Opal with a trailing slash such as **https://www.example.com/some-path/discovery/** then the end point URL provided in the discovery data will be appended to the end of the discovery url.  If you omit the trailing slash, then the endpoint URL then replaces **/discover**.  To account for users potentially registering the discovery endpoint both with and without a trailing slash, I have added two route attributes to my controller action to cater for both types of URL Opal will generate.

```C#
[HttpPost]
[Route("/stott.robotshandler/opal/tools/get-robot-txt-configurations/")]
[Route("/stott.robotshandler/opal/discovery/tools/get-robot-txt-configurations/")]
[OpalAuthorization(OpalAuthorizationLevel.Read)]
public IActionResult GetRobotTxtConfigurations([FromBody]ToolRequest<GetRobotTextConfigurationsQuery> model)
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

            return CreateSafeJsonResult(ToOpalModel(specificConfiguration));
        }

        return CreateSafeJsonResult(ToOpalModels(configurations));
    }
    catch(Exception ex)
    {
        _logger.LogError(ex, "An error was encountered while processing the robot-txt-configurations tool.");
        throw;
    }
}
```

When you register your tools in Opal, you have the option to provide a bearer token that will be sent in an Authorization header.  You may have noticed that my contoller action also has an **OpalAuthorization** attribute.  This is a custom attribute that checks for the presence of an Authorization header with a bearer token.  When you reg

```C#
public sealed class OpalAuthorizationAttribute : Attribute, IActionFilter
{
    public OpalAuthorizationLevel AuthorizationLevel { get; set; } = OpalAuthorizationLevel.None;

    public OpalAuthorizationAttribute(OpalAuthorizationLevel authorizationLevel)
    {
        AuthorizationLevel = authorizationLevel;
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        var authorizationLevel = GetAuthorization(context.HttpContext.Request);
        if (authorizationLevel < AuthorizationLevel)
        {
            context.Result = new ContentResult
            {
                StatusCode = 401,
                Content = "You are not authorized to access this resource.",
                ContentType = "text/plain"
            };
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // No action needed after execution
    }

    private static OpalAuthorizationLevel GetAuthorization(HttpRequest request)
    {
        try
        {
            if (!request.Headers.TryGetValue("Authorization", out var authorizationHeader))
            {
                return OpalAuthorizationLevel.None;
            }

            var tokenValue = authorizationHeader.ToString().Split(' ').Last();
            if (string.IsNullOrWhiteSpace(tokenValue))
            {
                return OpalAuthorizationLevel.None;
            }

            var tokenRepository = ServiceLocator.Current.GetInstance<IOpalTokenRepository>();
            var tokenConfiguration = tokenRepository.List().Where(x => x.Token == tokenValue).FirstOrDefault();
            if (tokenConfiguration is null)
            {
                return OpalAuthorizationLevel.None;
            }

            return string.Equals(tokenConfiguration.Scope, "Write") ? OpalAuthorizationLevel.Write : OpalAuthorizationLevel.Read;
        }
        catch (Exception)
        {
            return OpalAuthorizationLevel.None;
        }
    }
}
```

```C#
[EPiServerDataStore(AutomaticallyCreateStore = true, AutomaticallyRemapStore = true)]
public class OpalTokenEntity : IDynamicData
{
    public Identity Id { get; set; }

    public string Name { get; set; }

    public string Scope { get; set; }

    public string Token { get; set; }
}
```

```C#
public class OpalTokenRepository : IOpalTokenRepository
{
    private readonly DynamicDataStore store;

    public OpalTokenRepository()
    {
        store = DynamicDataStoreFactory.Instance.CreateStore(typeof(OpalTokenEntity));
    }

    public void Delete(Guid id)
    {
        store.Delete(Identity.NewIdentity(id));
    }

    public List<TokenModel> List()
    {
        var records = store.Find<OpalTokenEntity>(new Dictionary<string, object>()).ToList();

        return records.Select(ToModel).ToList();
    }

    public void Save(TokenModel saveModel)
    {
        var recordToSave = Get(saveModel.Id);
        recordToSave ??= new OpalTokenEntity
        {
            Id = Identity.NewIdentity(Guid.NewGuid())
        };

        recordToSave.Name = saveModel.Name;
        recordToSave.Scope = saveModel.Scope ?? "read";
        recordToSave.Token = saveModel.Token;

        store.Save(recordToSave);
    }

    private static TokenModel ToModel(OpalTokenEntity entity)
    {
        if (entity is null)
        {
            return null;
        }

        return new TokenModel
        {
            Id = entity.Id.ExternalId,
            Name = entity.Name,
            Scope = entity.Scope,
            Token = entity.Token
        };
    }

    private OpalTokenEntity Get(Guid id)
    {
        if (Guid.Empty.Equals(id))
        {
            return null;
        }

        return store.Load<OpalTokenEntity>(Identity.NewIdentity(id));
    }
}
```