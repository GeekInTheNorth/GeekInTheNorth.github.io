---
layout: post
title: "Creating an Optimizely Addon - Best Practices"
description: "Best practices for creating an Optimizely CMS AddOn."
permalink: "/article/creating-an-optimizely-addon-part-4"
category:
  - Development
  - Optimizely
relatedArticles:
  - "_posts/2024-08-28-how-to-create-an-optimizely-addon-part-1.md"
  - "_posts/2024-08-30-how-to-create-an-optimizely-addon-part-2.md"
  - "_posts/2024-09-16-how-to-create-an-optimizely-addon-part-3.md"
  - "_posts/2021-08-31-custom-admin-pages-in-optimizely-12.md"
---

# Creating an Optimizely Addon - Best Practices

Published: 24th October 2024

In [Part One](/article/creating-an-optimizely-addon-part-1), [Part Two](/article/creating-an-optimizely-addon-part-2) and [Part Three](/article/creating-an-optimizely-addon-part-3), I have outlined the steps required to create an AddOn for Optimizely CMS, from architecture to packaging at as a NuGet package. In this part I will be covering some best practices that will help you succeed as an AddOn developer. You can view examples from across this series within the this [Optimizely AddOn Template](https://github.com/GeekInTheNorth/OptimizelyAddOnTemplate) that I have been creating.

## Unit Tests

As a solo developer managing multiple AddOns, my ability to release updates regularly relies heavily on having extensive unit tests. For instance, [Stott Security](https://github.com/GeekInTheNorth/Stott.Security.Optimizely) includes over 1,500 unit tests that run whenever a pull request is made to merge a feature branch into the develop branch. This level of coverage ensures that functionality remains consistent across releases.

As well as writing unit tests for your business logic, you can also write additional unit tests that validate the security of your controllers. I would consider adding these tests to be an essential part of ensuring the security of your system as they ensure the following:

- Controller actions explicitly allow only the intended HTTP methods, ensuring endpoints respond only to the correct verbs.
- Controller actions are secured with the Authorization attribute or marked with AllowAnonymous if security isn’t required. This enforces clear security requirements for each endpoint.
- Controller actions are defined with specific routes, preventing conflicts with other modules or the consuming application’s routing.

```
[TestFixture]
public sealed class ControllerStandardsTests
{
    [Test]
    [TestCaseSource(typeof(ControllerStandardsTestCases), nameof(ControllerStandardsTestCases.PageControllerActionTestCases))]
    public void ControllersShouldHaveHttpMethodAttributes(string controllerName, string methodName, MethodInfo methodInfo)
    {
        // Act
        var hasHttpMethodAttribute = methodInfo.GetCustomAttributes(typeof(HttpMethodAttribute)).Any();

        // Assert
        // Controllers should only respond in intended Verbs and should respond with method not allowed on unintended verbs.
        // This will prevent posting of malicious payloads to methods not intended to retrieve of deal with these payloads.
        // First raised by a penetration test where an attempt to post files to a content end point returned a 200 instead of a 405
        Assert.That(hasHttpMethodAttribute, Is.True, $"{controllerName}.{methodName} should be decorated with a http method attribute.");
    }

    [Test]
    [TestCaseSource(typeof(ControllerStandardsTestCases), nameof(ControllerStandardsTestCases.PageControllerActionTestCases))]
    public void ControllerMethodsShouldEitherHaveAuthorizeOrAllowAnonymousAttributes(string controllerName, string methodName, MethodInfo methodInfo)
    {
        // Act
        var hasAuthorizeAttribute = methodInfo.GetCustomAttributes(typeof(AuthorizeAttribute)).Any();
        var hasAllowAnonymousAttribute = methodInfo.GetCustomAttributes(typeof(AllowAnonymousAttribute)).Any();
        var controllerHasAuthorizeAttribute = methodInfo.DeclaringType?.GetCustomAttributes(typeof(AuthorizeAttribute)).Any() ?? false;

        var hasAttribute = hasAuthorizeAttribute || hasAllowAnonymousAttribute || controllerHasAuthorizeAttribute;

        // Assert
        // Controller actions should be protected with an Authorization attribute or an intentional AllowAnonymous attribute.
        // This will ensure your controllers are secure by default and that you have to explicitly allow anonymous access.
        Assert.That(hasAttribute, Is.True, $"{controllerName}.{methodName} should be decorated directly or indirectly with an Authorize or AllowAnonymous attribute.");
    }

    [Test]
    [TestCaseSource(typeof(ControllerStandardsTestCases), nameof(ControllerStandardsTestCases.PageControllerActionTestCases))]
    public void ControllerMethodsShouldHaveRouteAttributes(string controllerName, string methodName, MethodInfo methodInfo)
    {
        // Act
        var hasRouteAttribute = methodInfo.GetCustomAttributes(typeof(RouteAttribute)).Any();
        var controllerHasRouteAttribute = methodInfo.DeclaringType?.GetCustomAttributes(typeof(RouteAttribute)).Any() ?? false;

        var hasAttribute = hasRouteAttribute || controllerHasRouteAttribute;

        // Assert
        // Controller actions should have a fixed route attribute so as to not have clashes with routes declared by other modules.
        Assert.That(hasAttribute, Is.True, $"{controllerName}.{methodName} should be decorated directly with a Route attribute.");
    }
}
```

These tests use a Test Case Source method which uses reflection to identify all controllers within your solution. This means as you add new controllers, you will not forget to secure them.

```
public static class ControllerStandardsTestCases
{
    public static IEnumerable<TestCaseData> PageControllerActionTestCases
    {
        get
        {
            var assembly = Assembly.GetAssembly(typeof(SettingsLandingPageController));

            if (assembly == null)
            {
                yield break;
            }

            var controllers = assembly.GetTypes()
                                      .Where(t => (t.BaseType?.Name.StartsWith("Controller") ?? false)
                                               || (t.BaseType?.Name.StartsWith("BaseController") ?? false))
                                      .ToList();

            foreach (var controller in controllers)
            {
                var actions = controller.GetMethods()
                                        .Where(x => x.DeclaringType == controller && x.IsPublic)
                                        .ToList();

                foreach (var methodInfo in actions)
                {
                    if (methodInfo.ReturnType == typeof(IActionResult) || methodInfo.ReturnType == typeof(Task<IActionResult>))
                    {
                        yield return new TestCaseData(controller.Name, methodInfo.Name, methodInfo);
                    }
                }
            }
        }
    }
}
```

## Test System

If you have followed this series to create an AddOn, you'll note that the sample site for developing the AddOn does not use nuget to consume the AddOn code and instead uses a project reference. This will allow you to develop efficiently, however it does mean that you are not testing your code in a production-like manner.

Create a separate repository with it's own Optimizely CMS solution. Import your AddOn as a NuGet package directly into this solution. This will allow you to test your AddOn in the same way that another developer will be experiencing your AddOn for the first time. If you are able to generate a developer cloud license on [EPiServer License Centre](https://license.episerver.com/), then I would recommend you deploy this test system into an Azure WebApp running on Linux with .NET 6.0 or 8.0 so that you can validate your AddOn inside of a deployed environment.

As part of my go live cycle I perform the following:

- Create a beta version of my nuget package
- Upload the beta package to nuget.org
- Update my test system to use the beta package
- Deploy my test system to Azure
- Delist my beta version on nuget.org
- Test my AddOn in my test system
- Create a production version of my nuget package
- Upload the production package to nuget.optimizely.com
- Wait for the package to be approved by Optimizely's QA team
- Upload the production package to nuget.org
- Announce the release

## Performance and Caching

Optimizely's default settings for Azure SQL Server typically support around 120 simultaneous database connections, suggesting the use of an S2 SQL Database (or equivelent) for production. This configuration, combined with efficient caching by the Optimizely CMS code allows smaller databases to perform effectively for websites with high traffic.

If you're using Microsoft Entity Framework, be aware that each `DbContext` instance opens a new database connection. Failing to manage these connections can lead to server instability due to connection limits. Therefore, it's advisable to follow Optimizely's approach by extensively using caching. To implement this, consider the following steps:

- Use a Custom Cache Wrapper that consumes Optimizely's `ISynchronizedObjectInstanceCache` and uses it's own master key to allow you to purge your cache effectively.
- Inject your DbContext as a scoped object to limit the number of instances to 1 per request.
- Lazy Load dependencies that require a Db Context so that they are not instantiated if not consumed.
- Handle data loading in the following order:
  - Attempt to retrieve and return data from cache first.
  - Attempt to retrieve and return data from the database second.
    - Push the data into a cache before returning it.

The following is an example of a cache wrapper that consumes the `ISynchronizedObjectInstanceCache.`

```
public sealed class CacheWrapper : ICacheWrapper
{
    private readonly ISynchronizedObjectInstanceCache _cache;

    private const string MasterKey = "My-OptimizelyAddOn-MasterKey";

    public CacheWrapper(ISynchronizedObjectInstanceCache cache)
    {
        _cache = cache;
    }

    public void Add<T>(string cacheKey, T? objectToCache)
        where T : class
    {
        if (string.IsNullOrWhiteSpace(cacheKey) || objectToCache == null)
        {
            return;
        }

        try
        {
            var evictionPolicy = new CacheEvictionPolicy(
                TimeSpan.FromHours(12),
                CacheTimeoutType.Absolute,
                Enumerable.Empty<string>(),
                new[] { MasterKey });

            _cache.Insert(cacheKey, objectToCache, evictionPolicy);
        }
        catch (Exception exception)
        {
            // Add logging here
        }
    }

    public T? Get<T>(string cacheKey)
        where T : class
    {
        return _cache.TryGet<T>(cacheKey, ReadStrategy.Wait, out var cachedObject) ? cachedObject : default;
    }

    public void RemoveAll()
    {
        try
        {
            _cache.Remove(MasterKey);
        }
        catch (Exception exception)
        {
            // Add logging here
        }
    }
}
```

In order to use Lazy Loaded dependencies, you first need to define the Lazy variant within your service extension method:

```
services.AddScoped<IMyDataContext, MyDataContext>();
services.AddScoped<Lazy<IMyDataContext>>(provider => new Lazy<IMyDataContext>(() => provider.GetRequiredService<IMyDataContext>()));
```

You can then declare your dependencies as Lazy in your constructors and consume them as per the example below.  In this scenario, the `IMyDataContext` is instantiated once, but that is deferred until it is used by the `GetData()` method:

```
internal sealed class MyRepository : IMyRepository
{
  private readonly Lazy<IMyDataContext> _context;

  public MyRepository(Lazy<IMyDataContext> context)
  {
    _context = context;
  }

  public async Task<IList<string>> GetData()
  {
    return await _context.Value.MyData.ToListAsync();
  }
} 
```

A service can then consume both the `IMyRepository`and `ICacheWrapper` and make performant calls to retrieve data that has not changed.  In the following example we attempt to retrieve the data from the cache first, then if it is null or empty we then attempt to load the data from the repository, push that data into cache before returning it. If the `Delete` method is called within the service, we call `RemoveAll()` on the cache wrapper to invalidate cache entries based on a master key:

```
internal sealed class MyService : IMyService
{
  private readonly IMyRepository _repository;
  private readonly ICacheWrapper _cache;
  private const string CacheKey = "Unique.Cache.Key";

  public MyService(IMyRepository repository, ICacheWrapper cache)
  {
    _repository = repository;
    _cache = cache;
  }

  public async Task<IList<string>> GetDate()
  {
    var data = _cache.Get<IList<string>>(CacheKey);
    if (data is not { Count: >0 })
    {
      data = await _repository.GetData();
      _cache.Add(CacheKey, data);
    }

    return data;
  }

  public async Task Delete(string data)
  {
    await _repository.Delete(data);

    _cache.RemoveAll();
  }
}
```

Note how we don't need to lazy load the repository as the database context is already lazy loaded by the repository itself, however you may choose to lazy load the repository as it is not used if the cache is populated.

## Summary

- Ensure all key business logic is covered by a unit test.
- Use unit tests to enforce standards such as:
  - Controller actions have correct HTTP method attributes.
  - Controllers have secure actions with authorization or explicit anonymous access.
  - Controllers have defined routes to avoid conflicts.
- Test your AddOn in a separate production-like environment.
- Use caching to optimize database access.
- Implement lazy loading and scoped dependencies.
