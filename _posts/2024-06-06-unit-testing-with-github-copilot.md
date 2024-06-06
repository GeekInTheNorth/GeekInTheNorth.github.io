---
layout: post
title: "Unit Testing With GitHub Copilot"
description: "Writing unit tests with the help of GitHub Copilot, how well does it perform."
permalink: "/article/unit-testing-with-github-copilot"
category:
  - Development
  - Optimizely
---

# Unit Testing With GitHub Copilot

Published: 6th June 2024

I recently signed up for GitHub Copilot to explore the integration of AI in software development. My primary experience with AI in coding has been through ChatGPT, which has largely been disappointing and does not live up to the hype. Over 80% of the coding assistance I've received from ChatGPT has been incorrect or outdated. Additionally, attempts to clarify or provide further instructions often resulted in the same incorrect answers. When using ChatGPT to rephrase article content, about 50% of the outcomes altered the context so significantly that the meaning was entirely different.  Given these experiences, my expectations for GitHub Copilot are quite low.

The first unit test I wanted to write was for this handy extension method inside of a SiteDefinitionExtensions class that I have created for my Optimizely Robots AddOn:

```
public static IEnumerable<KeyValuePair<string, string>> ToHostSummaries(this IList<HostDefinition> hostDefinitions)
{
    yield return new KeyValuePair<string, string>("Default", string.Empty);
    if (hostDefinitions is not { Count: > 0 })
    {
        yield break;
    }

    foreach (var host in hostDefinitions.Where(x => x.Url is not null))
    {
        yield return new KeyValuePair<string, string>(host.Name, host.Url.ToString());
    }
}
```

I created a new test class by the name of SiteDefinitionExtensionTests, added the [TestFixture] attribute to the class and then started to write my first test.  I got as far as writing `public void ToHostSummaries` and I was presented with the following test as an auto complete:

```
[Test]
public void ToHostSummaries_WhenHostDefinitionsIsNull_ShouldReturnDefault()
{
    // Arrange
    var hostDefinitions = new List<HostDefinition>();

    // Act
    var result = hostDefinitions.ToHostSummaries();

    // Assert
    Assert.AreEqual(1, result.Count());
    Assert.AreEqual("Default", result.First().Key);
    Assert.AreEqual(string.Empty, result.First().Value);
}
```

GitHub Copilot went as far as to add the `[Test]` attribute, name the test, and write all the code. However, it didn't add the necessary imports to the class file, so I had to correct that. Additionally, it didn't properly set up the initial collection's null state, causing a mismatch between the test and its name. It also used the `Assert.AreEqual(expectedValue, actualValue)` syntax, which is not my preferred style. I favor the `Assert.That(actualValue, Is.EqualTo(expectedValue))` style, as I find it is much more understandable when read aloud. After my amends, the test ended up as such:

```
[Test]
public void ToHostSummaries_WhenHostDefinitionsIsNull_ShouldReturnDefault()
{
    // Arrange
    IList<HostDefinition> hostDefinitions = null;

    // Act
    var result = hostDefinitions.ToHostSummaries().ToList();

    // Assert
    Assert.That(result, Has.Count.EqualTo(1));
    Assert.That(result[0].Key, Is.EqualTo("Default"));
    Assert.That(result[0].Value, Is.EqualTo(string.Empty));
}
```

I started writing my second test as `public void ToHostSummaries`, and it suggested the following test, which was entirely correct. It learned from my previous intervention, adopting my preferred assertion style and the way I declared the opening variable.

```
[Test]
public void ToHostSummaries_WhenHostDefinitionsIsEmpty_ShouldReturnDefault()
{
    // Arrange
    IList<HostDefinition> hostDefinitions = new List<HostDefinition>();

    // Act
    var result = hostDefinitions.ToHostSummaries().ToList();

    // Assert
    Assert.That(result, Has.Count.EqualTo(1));
    Assert.That(result[0].Key, Is.EqualTo("Default"));
    Assert.That(result[0].Value, Is.EqualTo(string.Empty));
}
```

The third test I wanted to write was where the `hostDefinitions` collection contained entries, again I typed `public void ToHostSummaries` and the following was generated:

```
[Test]
public void ToHostSummaries_WhenHostDefinitionsIsNotEmpty_ShouldReturnHostSummaries()
{
    // Arrange
    IList<HostDefinition> hostDefinitions = new List<HostDefinition>
    {
        new HostDefinition
        {
            Name = "Host1",
            Url = new Uri("http://host1.com")
        },
        new HostDefinition
        {
            Name = "Host2",
            Url = new Uri("http://host2.com")
        }
    };

    // Act
    var result = hostDefinitions.ToHostSummaries().ToList();

    // Assert
    Assert.That(result, Has.Count.EqualTo(3));
    Assert.That(result[0].Key, Is.EqualTo("Default"));
    Assert.That(result[0].Value, Is.EqualTo(string.Empty));
    Assert.That(result[1].Key, Is.EqualTo("Host1"));
    Assert.That(result[1].Value, Is.EqualTo("http://host1.com/"));
    Assert.That(result[2].Key, Is.EqualTo("Host2"));
    Assert.That(result[2].Value, Is.EqualTo("http://host2.com/"));
}
```

The initial structure of the test appeared sound, and its choices seemed appropriate. However, the test failed to compile. The Url property on the `HostDefinition` class has only a public getter and no setter, and its value is based on the Name property and can be conditionally null. GitHub Copilot didn't decompile or fully understand the class, so I had to make additional changes to the test.

```
[Test]
public void ToHostSummaries_WhenHostDefinitionsIsNotEmpty_ShouldReturnHostSummaries()
{
    // Arrange
    IList<HostDefinition> hostDefinitions = new List<HostDefinition>
    {
        new() { Name = "host1.com" },
        new() { Name = "host2.com" }
    };

    // Act
    var result = hostDefinitions.ToHostSummaries().ToList();

    // Assert
    Assert.That(result, Has.Count.EqualTo(3));
    Assert.That(result[0].Key, Is.EqualTo("Default"));
    Assert.That(result[0].Value, Is.EqualTo(string.Empty));
    Assert.That(result[1].Key, Is.EqualTo("host1.com"));
    Assert.That(result[1].Value, Is.EqualTo("http://host1.com/"));
    Assert.That(result[2].Key, Is.EqualTo("host2.com"));
    Assert.That(result[2].Value, Is.EqualTo("http://host2.com/"));
}
```

The final test for this class was to prove that host definitions with a null URL are omitted from the result.  Again I just had to type `public void ToHostSummaries` to get the following result:

```
[Test]
public void ToHostSummaries_WhenHostDefinitionsContainsNullUrl_ShouldReturnHostSummaries()
{
    // Arrange
    IList<HostDefinition> hostDefinitions = new List<HostDefinition>
    {
        new() { Name = "host1.com", Url = null },
        new() { Name = "host2.com" }
    };

    // Act
    var result = hostDefinitions.ToHostSummaries().ToList();

    // Assert
    Assert.That(result, Has.Count.EqualTo(3));
    Assert.That(result[0].Key, Is.EqualTo("Default"));
    Assert.That(result[0].Value, Is.EqualTo(string.Empty));
    Assert.That(result[1].Key, Is.EqualTo("host2.com"));
    Assert.That(result[1].Value, Is.EqualTo("http://host2.com/"));
}
```

Unfortunately, GitHub Copilot does not understand the internals of the `HostDefinition` class. While the Act part of the test had the correct structure, the Assert contained an incorrect assertion for the number of items to be returned. Additionally, the Arrange section needed complete correction, though I noted it did follow my example of using the `new()` syntax. If the host definition has a name of `*`, the URL will be empty, and the host definition becomes a wildcard definition which my extension method excludes from the results.

```
[Test]
public void ToHostSummaries_WhenHostDefinitionsContainsNullUrl_ShouldReturnHostSummaries()
{
    // Arrange
    IList<HostDefinition> hostDefinitions = new List<HostDefinition>
    {
        new() { Name = "*" },
        new() { Name = "host2.com" }
    };

    // Act
    var result = hostDefinitions.ToHostSummaries().ToList();

    // Assert
    Assert.That(result, Has.Count.EqualTo(2));
    Assert.That(result[0].Key, Is.EqualTo("Default"));
    Assert.That(result[0].Value, Is.EqualTo(string.Empty));
    Assert.That(result[1].Key, Is.EqualTo("host2.com"));
    Assert.That(result[1].Value, Is.EqualTo("http://host2.com/"));
}
```

Interestingly, I deleted the test file and recreated it from scratch. By the time I started writing the method name for the first test, it had suggested the code for the first three tests but not the fourth. Additionally, without an example of my preferred assertion style within the test class, it reverted to using the `Assert.AreEqual(...)` syntax. GitHub Copilot also seemed to forget what it had previously learned about using the `new()` syntax and the quirks of the HostDefinition class.

I then proceeded to write eight more unit tests, this time for the `RobotsContentService`. There were already some established tests within the test class and the various methods on the service had different signatures. GitHub Copilot's initial suggestions were accurate in terms of test naming but entirely incorrect in terms of the code it generated for the tests. However, it did soon adjust, although I quickly learned its limitations.

## In Conclusion

GitHub Copilot can significantly speed up your test writing process; it helped me write those tests in less than half the usual time. It also effectively considered all possible test cases (at least in title) based on the internal conditions of the method under test. I found that the more detailed I was in naming the test methods, following the `MethodName_WhenConditionIsApplied_ThenOutcomeIsDescribed` format, the more specific the generated tests became. Overall, I'm pleased with the support GitHub Copilot provided; it felt like pair programming with a junior developer. However, my key takeaways are:

- Scrutinize everything the AI generates, as there is a significant chance of errors or inefficiencies.
- "Garbage in, garbage out" still applies; the quality of the code depends on the quality of the code it can access.
- AI, in its current state, will not replace you but can augment your productivity.
