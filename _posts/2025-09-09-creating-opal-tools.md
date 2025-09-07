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
- The Discover and Tool endpoints remain in the same part of the routing structure as the rest of my add-on.

## Opal Tool Requirements

All that Opal effectively needs is a discovery endpoint that returns a specific JSON structure and a list of endpoints that accept a specific JSON structure and return any structure in return.

## Discovery Endpoint

The discovery endpoint JSON must contain a functions array which contains an entry for each tool.  Each tool must specify a name, description, an array of parameters, an endpoint relative to the discovery endpoint and a desired HTTP method.

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
            "http_method": "POST"
        }
    ]
}
```

> 💡 **Tip:** the discovery endpoint must be accessible anonymously.

### Tool Endpoint

**POST: /tools/tool-name**
```json
{
    "parameters": {
        "parameterName": "parameter value"
    }
}
```

```C#
[HttpGet]
[AllowAnonymous]
[Route("/stott.robotshandler/opal/discovery/")]
public IActionResult Discovery()
{
    var authorizationLevel = HttpContext.Items[RobotsConstants.OpalAuthorizationLevelKey] as OpalAuthorizationLevel? ?? OpalAuthorizationLevel.None;
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

```C#
public class ToolRequest<TModel> where TModel : class
{
    public TModel Parameters { get; set; }
}

public class GetRobotTextConfigurationsQuery
{
    public string HostName { get; set; }
}
```

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

```C#
public enum OpalAuthorizationLevel
{
    None = 0,
    Read = 1,
    Write = 2
}
```

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
        context.HttpContext.Items[RobotsConstants.OpalAuthorizationLevelKey] = authorizationLevel;

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