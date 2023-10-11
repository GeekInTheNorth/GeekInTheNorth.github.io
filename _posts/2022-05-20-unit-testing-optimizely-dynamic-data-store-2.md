---
layout: post
title: "Unit Testing Optimizely CMS 12 Dynamic Data Store - Part 2"
description: "Introducing a second way to mock and unit test with the Dynamic Data Store in Optimizely CMS 12."
permalink: "/article/unit_testing_optimizely_dynamic_data_store_2"
category:
  - Development
  - Optimizely
---

# Unit Testing Optimizely CMS 12 Dynamic Data Store - Part 2

Published: 20th May 2022

## Background

In the previous article of this series, [Unit Testing Optimizely CMS 12 Dynamic Data Store - Part 1](/article/unit_testing_optimizely_dynamic_data_store_1), an introduction was given to what the Dynamic Data Store is, and an approach was given for unit testing by mocking the `DynamicDataStore` object.

## Approach

Developers who are familiar with Entity Framework (EF) or Unit of Work (UOW) pattern may see some familiarity with this approach, and EF was indeed my inspiration here.

For this example, I am using a custom data object which implements the `IDynamicData` interface required for use with Dynamic Data Store:

```
public class MyCustomDataObject : IDynamicData
{
    public Identity Id { get; set; }

    public string UniqueText { get; set; }

    public string SomeOtherText { get; set; }
}
```

Next we add an interface for data context, and since this will potentially expose multiple data collections, we also add an interface for operations on a data collection:

```
public interface IDdsContext
{
   IDdsEntityCollection<MyCustomDataObject> MyCustomDataObjects { get; }
}

public interface IDdsEntityCollection<TModel>
   where TModel : IDynamicData
{
    IOrderedQueryable<TModel> Items();

    IEnumerable<TModel> AllItems();

    TModel Get(Identity identity);

    IEnumerable<TModel> Find(string propertyName, object propertyValue);

    Identity Save(TModel entity);
}
```

Next we need to add a implementation of the `IDdsEntityCollection<TModel>` to facilitate data operations against a singular data type.  As you will see below, each of the implemented methods is as light weight as possible.  If you are using additional methods within the Dynamic Data Store, then you will need to extend this interface and implementation.

```
public class DdsEtityCollection<TModel> : IDdsEntityCollection<TModel>
   where TModel : IDynamicData
{
   private DynamicDataStore _dynamicDataStore;

   public DdsEtityCollection(DynamicDataStoreFactory dynamicDataStoreFactory)
   {
       _dynamicDataStore = dynamicDataStoreFactory.CreateStore(typeof(TModel));
   }

   public IOrderedQueryable<TModel> Items()
   {
       return _dynamicDataStore.Items<TModel>();
   }

   public IEnumerable<TModel> AllItems()
   {
       return _dynamicDataStore.LoadAll<TModel>() ?? Enumerable.Empty<TModel>();
   }

   public TModel Get(Identity identity)
   {
       return _dynamicDataStore.Load<TModel>(identity);
   }

   public IEnumerable<TModel> Find(string propertyName, object propertyValue)
   {
       return _dynamicDataStore.Find<TModel>(propertyName, propertyValue);
   }

   public Identity Save(TModel entity)
   {
       return _dynamicDataStore.Save(entity);
   }
}
```

Now we have an implementation of `IDdsEntityCollection<TModel>`, we can now implement `IDdsContext`. In this example, the implementation of `IDdsEntityCollection<TModel>` is not instantiated until it is actually required by the consuming code.

```
public class DdsContext : IDdsContext
{
   private DynamicDataStoreFactory _dataStoreFactory;

   public DdsContext(DynamicDataStoreFactory dataStoreFactory)
   {
       _dataStoreFactory = dataStoreFactory;
   }

   private IDdsEntityCollection<MyCustomDataObject> _myCustomDataObjects = null;

   public IDdsEntityCollection<MyCustomDataObject> MyCustomDataObjects
   {
       get
       {
           if (_myCustomDataObjects == null)
           {
               _myCustomDataObjects = new DdsEtityCollection<MyCustomDataObject>(_dataStoreFactory);
           }

           return _myCustomDataObjects;
       }
   }
}
```

Now we can update the repository we created in [Part 1](/article/unit_testing_optimizely_dynamic_data_store_1) of this series, stripping out the Dynamic Data Store objects and injecting the `IDdsContext` instead.

```
public class MyCustomDataObjectRepository
{
   private readonly IDdsContext _context;

   public MyCustomDataObjectRepository(IDdsContext context)
   {
       _context = context;
   }

   public void Save(Guid id, string uniqueText, string someOtherText)
   {
       var matchingRecord = _context.MyCustomDataObjects.Find(nameof(MyCustomDataObject.UniqueText), uniqueText).FirstOrDefault();

       if (matchingRecord != null && !matchingRecord.Id.ExternalId.Equals(id))
       {
           throw new EntityExistsException($"An entry already exists for the unique value of '{uniqueText}'.");
       }

       var recordToSave = Guid.Empty.Equals(id) ? CreateNewRecord() : _context.MyCustomDataObjects.Get(Identity.NewIdentity(id));
       recordToSave.UniqueText = uniqueText;
       recordToSave.SomeOtherText = someOtherText;
       _context.MyCustomDataObjects.Save(recordToSave);
   }

   private static MyCustomDataObject CreateNewRecord()
   {
       return new MyCustomDataObject { Id = Identity.NewIdentity() };
   }
}
```

Finally, we can write the same unit tests again, however we are now mocking interfaces inside of our repositories instead of mocking the implementations of the Dynamic Data Store.

```
[TestFixture]
public class MyCustomDataObjectRepositoryTests
{
   private Mock<IDdsEntityCollection<MyCustomDataObject>> _mockDataCollection;
   private Mock<IDdsContext> _mockContext;
   private MyCustomDataObjectRepository _repository;

   [SetUp]
   public void SetUp()
   {
       _mockDataCollection = new Mock<IDdsEntityCollection<MyCustomDataObject>>();
       _mockContext = new Mock<IDdsContext>();
       _mockContext.Setup(x => x.MyCustomDataObjects).Returns(_mockDataCollection.Object);
       _repository = new MyCustomDataObjectRepository(_mockContext.Object);
   }

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

       _mockDataCollection.Setup(x => x.Find(It.IsAny<string>(), It.IsAny<object>()))
                          .Returns(new List<MyCustomDataObject> { existingRecord });

        // Assert
       Assert.Throws<EntityExistsException>(() => _repository.Save(Guid.Empty, uniqueText, someOtherText));
   }
}
```

## Summary

This approach to unit testing with the Dynamic Data Store did the following.

- Created a data collection interface and implementation using generics for operations on the DynamicDataStore object for a given type.
- Created an interface and implementation of a data context which exposed only interfaces for the data collections.
- Injected the interface data context into repositories instead of the Dynamic Data Store.

## Which Approach

When deciding which approach to take, consider just how many operations and data types you will be using with the Dynamic Data Store.  Consider whether all of the scaffolding of the data context approach in this article out weighs your usage of the Dynamic Data Store.  Remember the [KISS](https://en.wikipedia.org/wiki/KISS_principle) and [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) principals and I'm sure you'll get the right solution for your project.

Finally, if you are finding you are heavily using the Dynamic Data Store, consider using your own tables using Entity Framework or any other Object Relational Mapper (ORM).  You will have better performance with data tables which are designed to suit your data needs.