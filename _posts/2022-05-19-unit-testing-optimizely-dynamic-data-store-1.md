---
layout: post
title: "Unit Testing Optimizely CMS 12 Dynamic Data Store - Part 1"
description: "Optimizely CMS 12 provides a Dynamic Data Store for custom storing of data, but how do we unit test a repository using the Dynamic Data Store?"
permalink: "/article/unit_testing_optimizely_dynamic_data_store_1"
category:
  - Development
  - Optimizely
relatedArticles:
  - "_posts/2022-05-20-unit-testing-optimizely-dynamic-data-store-2.md"
  - "_posts/2018-09-29-unit-testing-episerver.md"
---

# Unit Testing Optimizely CMS 12 Dynamic Data Store - Part 1

<i class="fa-solid fa-calendar me-2"></i>Published: 19th May 2022

## Background

Optimizely CMS 12 comes with built in support for custom data that is not a content type.  This comes in the form of the Dynamic Data Store (DDS) which is a component that offers an API and infrastructure for CRUD operations of both compile time data types (.NET Objects) and runtime data types (property bags) within shared tables contained in the CMS database.

Developers can develop their own functionality which consumes the Dynamic Data Store; Optimizely also use the same functionality for some of their own features.  For example, Optimizely Search & Navigation comes with a feature known as Best Bets which allows content editors to provide search suggestions for given search terms.  Each Best Bet has it's own entry inside of the Dynamic Data Store.

This article is the first of two articles showing developers how they can unit test with the Dynamic Data Store, each with it's own separate technical approach.  Both approaches are valid, but the choice in approach may come down to how many different operations you are under taking with the Dynamic Data Store.

## The Repository Under Test

Lets assume we have a custom data object that we want to store in the Dynamic Data Store as follows:

    public class MyCustomDataObject : IDynamicData
    {
       public Identity Id { get; set; }
       public string UniqueText { get; set; }
       public string SomeOtherText { get; set; }
    }

The object `MyCustomDataObject` has an Identity in order to meet the `IDynamicData` interface which is the minimum requirement for storage within the Dynamic Data Store.  The UniqueText property should be unique to that instance of the `MyCustomDataObject`, the `SomeOtherText` is just additional information to be stored with that record.

A repository that handles the saving of `MyCustomDataObject` records may look something like this:

    public class MyCustomDataObjectRepository
    {
        private readonly DynamicDataStore _dataStore;
    
        public MyCustomDataObjectRepository(DynamicDataStoreFactory dataStoreFactory)
        {
            _dataStore = dataStoreFactory.CreateStore(typeof(MyCustomDataObject));
        }
    
        public void Save(Guid id, string uniqueText, string someOtherText)
        {
            var matchingRecord = _dataStore.Find<MyCustomDataObject>(nameof(MyCustomDataObject.UniqueText), uniqueText).FirstOrDefault();
    
            if (matchingRecord != null && !matchingRecord.Id.ExternalId.Equals(id))
            {
                throw new EntityExistsException($"An entry already exists for the unique value of '{uniqueText}'.");
            }
    
            var recordToSave = Guid.Empty.Equals(id) ? CreateNewRecord() : _dataStore.Load<MyCustomDataObject>(Identity.NewIdentity(id));
            recordToSave.UniqueText = uniqueText;
            recordToSave.SomeOtherText = someOtherText;
            _dataStore.Save(recordToSave);
        }
    
        private static MyCustomDataObject CreateNewRecord()
        {
            return new MyCustomDataObject { Id = Identity.NewIdentity() };
        }
    }

## Unit Testing

In order to unit test the repository behaviour, we need to mock the Dynamic Data Store.  Optimizely does not provide any interfaces to assist with the writing of unit tests and we have to mock implementations instead. 

The mocking of implementations can come with it's own complications.  With a mock behaviour of 'strict', the mocked object will behave like the true implementation and will throw exceptions as expected.  With a mock behaviour of 'loose', no exceptions will be thrown and default values will be returned as necessary.  The default mock behavior of any mocked object is actually the strict behaviour.

The strict mock behavior makes unit testing of the Dynamic Data Store impossible with exceptions being thrown during the set up of the test.  So in the following setup method, I have mocked the `StoreDefinition`, the `DynamicDataStore` and the `DynamicDataStoreFactory` with a loose mock behavior.  This is done by supplying the behavior in the mock constructor. The additional parameters applied to the mock constructors are default types which fulfil the constructor of the implementation being mocked.

    [TestFixture]
    public class MyCustomDataObjectRepositoryTests
    {
        private Mock<DynamicDataStoreFactory> _mockDynamicDataStoreFactory;
    
        private Mock<DynamicDataStore> _mockDynamicDataStore;
    
        private Mock<StoreDefinition> _mockStoreDefinition;
    
        private MyCustomDataObjectRepository _repository;
    
    [SetUp]
    public void SetUp()
    {
        _mockStoreDefinition = new Mock<StoreDefinition>(
            MockBehavior.Loose,
            string.Empty,
            new List<PropertyMap>(0),
            null);
    
        _mockDynamicDataStore = new Mock<DynamicDataStore>(
            MockBehavior.Loose,
            _mockStoreDefinition.Object);
    
        _mockDynamicDataStoreFactory = new Mock<DynamicDataStoreFactory>();
        _mockDynamicDataStoreFactory.Setup(x => x.CreateStore(typeof(MyCustomDataObject)))
                                    .Returns(_mockDynamicDataStore.Object);
    
        _repository = new MyCustomDataObjectRepository(_mockDynamicDataStoreFactory.Object);
    }

At this point we are now free to write unit tests as easily as we would do when mocking interfaces.  In the following test example, an existing record is created and is set to be the result of the mocked `Find` method against the `DynamicDataStore`. When we try to save a record with a matching uniqueText, the desired outcome is that an `EntityExistsException` is thrown and our assertion is constructed to prove that.

    [Test]
    public void GivenUniqueTextExistsAgainstAnotherEntity_ThenAnEntityExistsExceptionShouldBeThrown()
    {
        // Arrange
        var uniqueText = "i-am-unique";
        var someOtherText = "some-other-text";
    
        var existingRecord = new MyCustomDataObject
        {
            Id = Guid.NewGuid(),
            UniqueText = uniqueText,
            SomeOtherText = "original-other-text"
        };
    
        _mockDynamicDataStore.Setup(x => x.Find<MyCustomDataObject>(It.IsAny<string>(), It.IsAny<object>()))
                             .Returns(new List<MyCustomDataObject> { existingRecord });
    
        // Assert
        Assert.Throws<EntityExistsException>(() => _repository.Save(Guid.Empty, uniqueText, someOtherText));
    }

## Summary

In order to unit test against the Dynamic Data Store, you must do the following in order to write unit tests as normal:

- Mock the `StoreDefinition` with `MockBehavior.Loose`.
- Mock the `DynamicDataStore` with `MockBehavior.Loose` and pass in the mock of the `StoreDefinition`.
- Mock the `DynamicDataStoreFactory` with either mock behavior and set up the `CreateStore` method to return the mocked `DynamicDataStore`.

To be continued in part 2...
