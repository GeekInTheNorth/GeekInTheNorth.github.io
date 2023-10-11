---
layout: post
title: "Unit Testing EPiServer CMS 11"
description: "A solution for Unit Testing Custom Criterion for visitor groups in EPiServer CMS 11."
permalink: "/article/unit_testing_episerver"
category:
  - Development
  - Optimizely
---

# Unit Testing EPiServer CMS 11

Published: 29th September 2018

## The Requirement

I needed to implement a new visitor group criterion for an EPiServer CMS website. As part of this work I was introducing unit testing into the project and wanted to make sure that all of my new classes were unit tested.

## The First Issue

I created a new criterion class (MyCustomCriterion) that inherited from CriterionBase and set about writing my tests.  I set about writing tests and implementing logic and immediately hit a wall.  Model is a property of CriterionBase<T> of the type T and it is not injected or passed into the CriterionBase in any immediately obvious way. After some experimentation I did find that the model could be assigned as a property of a new VisitorGroupCriterion that could be passed into the Initialize event of the MyCustomCriterion class.

With the model now definable in the setup of a unit test, I set about writing my tests making them pass.  I injected my dependencies via the constructor of MyCustomCriterion and soon I had working custom criterion that looked a little like this.

```
[VisitorGroupCriterion(Category = "My Category", DisplayName = "My Custom Criterion")]
public class MyCustomCriterion : CriterionBase<MyCustomCriterionSettings>
{
    private readonly ICustomService service;

    public MyCustomCriterion(ICustomService service)
    {
        this.service = service;
    }

    public override bool IsMatch(IPrincipal principal, HttpContextBase httpContext)
    {
        MyCustomCriterionSettings settings = Model;

        // Some verification code to be tested

        return result;
    }
}
```

## The Second Issue

All of the logic was correct, all the unit tests passed.  In practice however, the MyCustomCriterion class caused the website to throw an error as any class inheriting from CriterionBase<T> must only have a parameterless constructor. Instead of injecting dependencies, the MyCustomCriterion was changed to use the ServiceLocator class to obtain instances of the dependencies.

In order to unit test a class using dependencies resolved with the ServiceLocator, you can create a mock of IServiceLocator and assign it to the static ServiceLocator class.  You can then mock your other dependencies and set them to be returned by the mock IServiceLocator.

```
private Mock<IServiceLocator> mockServiceLocator;
private Mock<IDependencyUnderTest> mockDependency;

[SetUp]
public void Setup()
{
    mockDependency = new Mock<IDependencyUnderTest>();

    mockServiceLocator = new Mock<IServiceLocator>();
    mockServiceLocator.Setup(x => x.GetInstance<IDependencyUnderTest>()).Returns(mockDependency.Object);

    ServiceLocator.SetLocator(mockServiceLocator.Object);
}

[Test]
public void TestOne()
{
    // Arrange
    mockDependency.Setup(x => x.MethodUnderTest(It.IsAny<int>())).Returns(1001);

    var criterion = new MyCustomCriterion();
    criterion.Initialize(
        new VisitorGroupCriterion
        {
            Model = new MyCustomCriterionSettings
            {
                Setting1 = 1,
                Setting2 = "Two"
            }
        });

    // Act
    var isMatch = criterion.IsMatch(null, null);

    // Assert
    Assert.That(isMatch, Is.True);
}
```
