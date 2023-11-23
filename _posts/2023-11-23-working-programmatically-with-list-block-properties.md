---
layout: post
title: "Working Programmatically With List Block Properties"
description: "Working with programmatic generation of IList<Block> style properties in Optimizely CMS 12."
permalink: "/article/working-programmatically-with-list-block-properties"
category:
  - Development
  - Optimizely
---

# Working Programmatically With List Block Properties

Published: 23rd November 2023

## Introduction

Recently we encountered some issues with a third party plugin with the latest version of Optimizely CMS 12.  As the Go Live clock was ticking down fast, we couldn't afford to wait for a fix to the third party plugin and I re-modelled the content to use a block list property instead.  Unfortunatley there were a significant number of instances of the content type that needed to be remodelled so we was decided that we would have to migrate the client's content for them rather than forcing them to reconstruct that part of the content again so close to the Go Live date.

## The solution

The built in Optimizely Migration Step functionality is really good for when you want to do something like rename a content type or property, but if that property is an entirely different type, then you have to manage this change yourself.

As I wanted to migrate the old property onto the new property and the old property was a complex object, I chose to hide the old property rather than remove it so I would have full access to it's structure.  To do this I added the **[ScaffoldColumn(false)]** attribute to the property which tells the CMS Interface not to render the property to the CMS Editor.  I also added the **[Obsolete]** attribute, technically I didn't need to, but it highlights to other developers that the property should be removed and it shows up in tools such as SonarCloud as a reminder to remove the property later on.

```
[Display(Name = "New Field Name")]
[MaxElements(20)]
public virtual IList<MyNewBlock>? NewField { get; set; }

[Obsolete("Remove this property after deployment to prod has migrated this property to 'New Field Name'.")]
[ScaffoldColumn(false)]
public virtual ThirdPartyPackageProperty? OldField { get; set; }
```

I then created a Migration Step class that inherits the Optimizely **MigrationStep** and I added an override for the **AddChanges()** method.  When making a Migration Step, I typically keep this method small and focused around catching and handling errors.  When the application starts up, Optimizely attempts to perform the migration step before it creates any new property types; this means that the first time this migration step is executed will result in a failure.  By catching and swallowing the error I can allow the first start up of the site to succeed and generate the new properties before triggering a second application restart so that the actual migration can take place.

```
public sealed class MyMigrationStep : MigrationStep
{
    public override void AddChanges()
    {
        try
        {
            MigratePages();
        }
        catch (Exception ex)
        {
            var logger = ServiceLocator.Current.GetInstance<ILogger<MyMigrationStep>>();
            logger.LogError(ex, "Failure encountered when attempting to migrate the content type.");
        }
    }
}
```

The **MigratePages()** method then uses the **IContentTypeRepository** to load the **ContentType** definition for the content type I want to perform the migration on.  I then pass this into an instance of **IContentModelUsage** which will then return a complete list of every language and version of that content type in a content usage model.  I want to convert all versions of every instance of my page type to allow for CMS Editors to compare across historical versions of the content as they will no longer be able to access the old property.  I then loop through each content usage and load the full content version using the **TryGet** method of the **IContentRepository**.

```
private static void MigratePages()
{
	var contentTypeRepository = ServiceLocator.Current.GetInstance<IContentTypeRepository>();
	var contentModelUsage = ServiceLocator.Current.GetInstance<IContentModelUsage>();
	var contentRepository = ServiceLocator.Current.GetInstance<IContentRepository>();

	var contentType = contentTypeRepository.Load(typeof(ExistingPageToChange));
	var usages = contentModelUsage.ListContentOfContentType(contentType);

	foreach (var contentUsage in usages)
	{
		if (contentRepository.TryGet<ExistingPageToChange>(
				contentUsage.ContentLink,
				new CultureInfo(contentUsage.LanguageBranch),
				out var ExistingPageToChange))
		{
			MigratePage(contentRepository, ExistingPageToChange);
		}
	}
}
```

The **MigratePage(...)** method starts off with a little protection to make sure that if the new property is only updated if the new property does not have a value and the old property does have a value.  As this migration might run multiple times, you may want to add a boolean to your content type which indicates if a migration has already been performed, but in my case I already had a plan to remove the old properties and the migration step in a rapid follow up release.

When you retrieve a piece of content from **IContentLoader** or **IContentRepository**, the object model is in a read only state.  In order to edit a piece of content, you first have to create a writeable clone by calling the **CreateWriteableClone()** method against content item.  This method exists upon the **PageData** object and clones the content item in a writable state, but the method has a return type of **PageData** so you will have to recast it as the type you are editing.  I then have a method called **ConvertProperty** that takes the old collection property and generates the new block list property.  To avoid casting issues when saving, I implicitly set the variable as an **IList<NewPropertyBlock>** before setting the property.

```
private static void MigratePage(IContentRepository contentRepository, ExistingPageToChange instance)
{
	var requiresMigration = instance.NewListBlockProperty.IsNullOrEmpty() && !instance.OldThirdPartyProperty.IsNullOrEmpty();
	if (!requiresMigration)
	{
		return;
	}

	var editableVersion = (ExistingPageToChange)instance.CreateWritableClone();

	// The variable has to be an IList<> in order to avoid a casting error.
	IList<NewPropertyBlock> list = ConvertProperty(contentRepository, instance.ContentLink, editableVersion.OldThirdPartyProperty).ToList();
	editableVersion.NewListBlockProperty = list;

	contentRepository.Save(editableVersion, SaveAction.Patch, AccessLevel.NoAccess);
}
```

Even though **IList<Block>** properties are saved as part of the **PageData** and not as separate content, it's still important to use the Content Repository to set up a default writable instance of the blocks within the collection.  If you just instantiate them as **new NewPropertyBlock()** then you will get an error when saving the block list against the page.

```
private static IEnumerable<NewPropertyBlock> ConvertProperty(
	IContentRepository contentRepository,
	ContentReference parentReference,
	ThirdPartyPackageProperty? oldPropertyList)
{
	if (oldPropertyList is not { Count: > 0 })
	{
		yield break;
	}

	foreach (var oldProperty in oldPropertyList)
	{
		var NewPropertyBlock = contentRepository.GetDefault<NewPropertyBlock>(parentReference);
		NewPropertyBlock.Link = new LinkItem
		{
			Href = oldProperty.Href,
			Title = oldProperty.Title,
			Target = oldProperty.Target,
			Text = oldProperty.Text
		};
		NewPropertyBlock.HoverImage = oldProperty.HoverImage;

		yield return NewPropertyBlock;
	}
}
```

The final step after finishing your edits to the content is to save the content back to the database.  Because I was aiming to update all content versions to the new model without creating new content versions I had to call the save function as follows:

```
contentRepository.Save(editableVersion, SaveAction.Patch, AccessLevel.NoAccess);
```

**SaveAction.Patch** updates the existing version of the content without creating a new version or triggering any validation.  As the save is being performed outside of the context of a user action, I had to pass in **AccessLevel.NoAccess** as the minimum access rights needed for the save to complete.  Had I passed in **AccessLevel.Publish**, then the save action would have to take place as part of a user action where the user had "publish" permissions to the content.

##Summary

- If you are changing the name of a property because it's type is the same
  - Create a MigrationStep and add a line to the AddChanges() method like this:
  - ContentType(nameof(MyContentType)).Property(nameof(MyContentType.NewPropertyName)).UsedToBeNamed("OldPropertyName");
- If you are changing the type of the property:
  - Give the new property an entirely new name, this will prevent casting issues with the property on the content type.
  - Create a MigrationStep for handling the property type change.
    - Use IContentTypeRepository to get the content type
    - Use IContentModelUsage to get all instances of the content type 
    - Use IContentRepository to create default instances of content types before creating new instances of a content type.
    - Use MyContentType.CreateWriteableClone() to get an editable version of the content you are changing.
    - Make sure you cast properties to the correct types when assigning them.
