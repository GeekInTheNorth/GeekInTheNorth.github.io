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

```json
{
    "parameters": {
        "hostName": ""
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