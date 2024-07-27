---
layout: post
title: "Creating an Optimizely Addon - Packaging for Nuget"
description: "How to a custom report within Optimizely CMS PAAS Core."
permalink: "/article/creating-an-optimizely-addon-part-4"
category:
  - Development
  - Optimizely
---

# Creating an Optimizely Addon - Packaging for Nuget

Published: 11th July 2024

The following article is part four in a four part series about making Addons for Optimizely CMS 12.  In this part I will be covering the challenges of creating and submitting your AddOn as a Nuget package into the Optimizely NuGet feed.


## Defining Nuget Properties

If you are using Visual Studio, right click on the project you want to package and select properties to show the project properties screen.  Under the Package section you can define all of the properties for your NuGet package.

![Project Properties Screen](../assets/creating-addons-project-properties.png)

I would recommend you complete the following:

| Property | Reason |
|----------|--------|
| Package Id | This will need to be globally unique name within nuget.org and nuget.optimizely.com.  If you use the `$(AssemblyName)` variable, then this will match the name of the project. |
| Title | Visual Studio describes this as the name of the package used in UI displays such as Package Manager, but this largely does not get used. |
| Package Version | This should be a semantic version number with three or four parts.  e.g. 2.7.0 |
| Authors | This should contain the names of all of the package owners. |
| Company | This should contain the name of the business that is behind creating the Addon.  If this is individually owned, then seting this to `$(Authors)` will mirror the value from the Authors property. |
| Description | This should be a short description about your Addon, this will be visible within the NuGet package feed and within the Plugin Manager screen within Optimizely CMS. |
| Copyright | This should contain the name of the owner and the year. You get copyright protection automatically when creating software and you do not have to apply or pay a fee.  There isn’t a register of copyright works in the UK.  There are however organisations which will provide extra protection for a fee for validating your copyright.  You can read more about copyright here: [How copyright protects your work](https://www.gov.uk/copyright). It is however worth you performing your own research into the matter within the country you live in. |
| Project Url | This should point either to the repository for your Addon or an appropriate project page.  Developers will use this to find out more about your Addon or to report issues that may need resolving. |
| Readme | I have set this to the readme.md for my repositories, this will be visible to developers within the NuGet platform. |
| Repository Url | This should point to the repository for your Addon, assuming that your Addon is Open Source. |
| Tags | This is a delimited set of tags that make your package easier to find within the NuGet feeds. |
| License File | This should point to the license within your repository.  You should think hard about what type of license your Addon will have.  I am using an MIT license because it's very permissive and without warranty.  Some license types can require your consumers to make their code open source in order to use your package, so think carefully about how permissive or restrictive you make your license.  I can say that some very popular Addons use an MIT or Apache license. |
| Require License Acceptance | If you tick this, the consumer will have to accept the license as they install the package. |

If you are using Visual Studio Code instead of Visual Studio, then you can edit the .csproj directly and add the package properties directly as XML values at the top of the csproj file.  You can also add these properties into a .nuspec instead, when you package your project, the values from the .csproj and .nuspec are merged into a new .nuspec that is contained in the root of the compiled .npg file.  I personnally prefer to put the NuGet properties directly into the .csproj.

```
<Project Sdk="Microsoft.NET.Sdk.Razor">
  <PropertyGroup>
    <TargetFrameworks>net6.0;net8.0</TargetFrameworks>
    <AddRazorSupportForMvc>true</AddRazorSupportForMvc>
    <Version>1.1.0.0</Version>
    <RepositoryUrl>https://example.com/</RepositoryUrl>
    <PackageProjectUrl>https://example.com/</PackageProjectUrl>
    <PackageLicenseFile>LICENSE.txt</PackageLicenseFile>
    <Authors>Your Name</Authors>
    <Description>Your Package Summary</Description>
    <Copyright>Your Name 2024</Copyright>
    <PackageTags>TagOne TagTwo</PackageTags>
    <PackageRequireLicenseAcceptance>true</PackageRequireLicenseAcceptance>
    <RepositoryType>git</RepositoryType>
    <PackageReadmeFile>README.md</PackageReadmeFile>
    <AssemblyVersion>1.1.0.0</AssemblyVersion>
    <GeneratePackageOnBuild>True</GeneratePackageOnBuild>
    <PackageReleaseNotes>A short release summary.</PackageReleaseNotes>
    <Nullable>enable</Nullable>
    <Title>Package Name</Title>
  </PropertyGroup>
```

## NuGet Package Structure

A NuGet Package is simply a zip file containing a structured set of files.  If you rename a .nupkg to a .zip, you can extract is and explore it's structure.  This will have a structure similar to the following:

- package
  - services
    - metadata
      - core-properties
- build
  - project.name.targets
- contentFiles
  - additional.file.txt
- lib
  - net6.0
    - my.project.dll
  - net8.0
    - my.project.dll
  - my.project.nuspec
- _rels
- [Content_Types].xml
- readme.md
- license.txt

Folders such as build, contentFiles and the target folders under lib will vary depending on your code and deployable files.  The readme.md and license.txt files referenced in your .csproj or .nuspec are copied to the root of the NuGet package.

## Packaging for Multiple Frameworks

.NET Core is backwards compatible, this means that if you build your package for .NET 6, it can be installed into .NET 6, 7 and 8.  For most AddOns you will just want to directly compile for .NET 6 for maximum compatability.

You may however need to compile your application in multiple framework versions.  If you are using Entity Framework and Migrations, then there is a breaking change between .NET 6 and .NET 8.  Fortunately you do not need to make any code changes, but you do want to set your dependencies separately for .NET 6 and .NET 8.  In order to achieve this, you need to make two changes.

1. Change the `TargetFramework` node in your .csproj to be `TargetFrameworks` and separate your target frameworks with a semicolon. e.g. `net6.0;net8.0`.
2. Add a separate `ItemGroup` per framework version to contain framework specific dependencies and add a condition to the ItemGroup to target the specific framework. e.g. `Condition="'$(TargetFramework)' == 'net6.0'"`. 

```
<Project Sdk="Microsoft.NET.Sdk.Razor">
  <PropertyGroup>
    <TargetFrameworks>net6.0;net8.0</TargetFrameworks>
    <AddRazorSupportForMvc>true</AddRazorSupportForMvc>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup Condition="'$(TargetFramework)' == 'net6.0'">
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="6.0.6" />
  </ItemGroup>

  <ItemGroup Condition="'$(TargetFramework)' == 'net8.0'">
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.1" />
  </ItemGroup>
```

This will double the size of your NuGet package as it will contain separate folders for each target framework containing your code compiled for that framework.

## Packaging Additional Files For The Protected Modules Folder

If your package contains an `IFrameComponent` or other files needed to extend the Editor Interface. A `module.config` file and those files will need to be deployed to the `modules/_protected/my.project` folder within the target website.

First will need to tell the .csproj file that we want to copy these files into the `contentFiles` folder of the nuget package.  This is as simple as setting the build output for those files to be `None` and to set the `PackagePath` to be inside of the `contentFiles` folder.

```
<ItemGroup>
  <None Include="module.config">
    <Pack>true</Pack>
    <PackagePath>contentFiles\module.config</PackagePath>
  </None>
</ItemGroup>
```

We will then need to create a .targets file that instructs the NuGet package installer how to handle those files.  The example below is taken straight from my own Addons where I am doing the same thing.

First I have to tell the .targets file where the specific files are within the nuget package structure.  The `$(MSBuildThisFileDirectory)` variable in this case is a reference to the directory the .targets file sits in.  As this is in a build folder, I have used the `$(MSBuildThisFileDirectory)` variable in combination with the relative path to my module.config file.

The `Target` node is then performing an action that is configured to execute on `BeforeBuild`.  This then performs a `Copy` action that will take my module.config file from the contentFiles folder in the nuget package to the `modules\_protected\Stott.Security.Optimizely` folder within the target website.  This means that when you first install the package, the module.config file and folder will not exist within the protected modules folder.  When you first build the solution they will be copied into this location.

```
<?xml version="1.0" encoding="utf-8"?>
<Project xmlns="http://schemas.microsoft.com/developer/msbuild/2003" ToolsVersion="4.0">
  <ItemGroup>
    <MyFiles Include="$(MSBuildThisFileDirectory)..\contentFiles\module.config" />
  </ItemGroup>
  
  <Target Name="CopyFiles" BeforeTargets="BeforeBuild">
        <Copy SourceFiles="@(MyFiles)" DestinationFolder="$(MSBuildProjectDirectory)\modules\_protected\Stott.Security.Optimizely\" />
    </Target>
</Project>
```

In order to make sure the .targets file can be executed, we also need to make sure that it is copied into the NuGet package file. This is as simple as setting the build output for the .targets file to be `None` and to set the `PackagePath` to be inside of the `build` folder.

```
<ItemGroup>
  <None Include="msbuild\copyfiles.targets">
    <Pack>true</Pack>
    <PackagePath>build\$(MSBuildProjectName).targets</PackagePath>
  </None>
</ItemGroup>
```

## Submitting Your Package

Before you can submit your AddOn to the Optimizely NuGet package feed you are going to want to test that your package installs successfully in your local environment and within a CI/CD pipeline.  To reduce the turn around time of this testing, you will want to publish your packages as alpha / beta builds into [nuget.org](https://www.nuget.org) first, so do make sure you create an account on nuget.org.

To set your package as an alpha or beta release, you need to set the `version` property within your .csproj to have a trailing `-alpha` or `-beta`.  NuGet will automatically recognise this as a pre-release and will typically filter these versions out by default.

```
<Version>2.0.0.2-beta</Version>
```

Once you have published the alpha/beta version of your package into nuget.org and confirmed that it installs correctly both locally and inside of a CI/CD pipeline and you have tested your package, you will be ready to submit a live version of your package to Optimizely.

Make sure that you have an [Optimizely World](https://world.optimizely.com) account.  You can create a new account by visiting [Optimizely World](https://world.optimizely.com) and following the Register link in the top right corner.  You will use this same account to access the Optimizely NuGet feeds.  It should be noted that Optimizely have two different NuGet feeds:

- https://nuget.optimizely.com this is a v2 NuGet feed.
- https://api.nuget.optimizely.com this is a v3 NuGet feed.

Packages uploaded to the v2 NuGet feed are automatically synchronized to the v3 NuGet feed so it is advisable that you typically upload your packages to the v2 NuGet feed.  Once Optimizely have received your package, it will go through an approval process.  This process may take one or more business days to complete.  You can periodically test the nuget feed to see if your package has been accepted.  If you have a hotfix to push out and this turnaround is inhibiting your rollout, you can always push the hotfix up to nuget.org.

I would advise that you upload your package to Nuget.org at least once and not limit yourself to just the Optimizely NuGet feed.  This makes sure that the package name is reserved on nuget.org as well.  You do not want a conflict in package names across the three main feeds to impact your consumers.

_Please Note that at the time of writing there was an issue with packages uploaded directly to the v3 NuGet not being synchronized back to the v2 NuGet feed.  Until this issue is resolved, the Upload link on the V3 NuGet feed pushes the user back to the v2 NuGet feed.  Optimizely are working to resolve this issue._

## Summary

- Build your package for .NET 6 for maximum compatability
  - Build your package for both .NET 6 & 8 if you have compatability issues between both frameworks.
- Use a Razor Class Library so you can package your UI and C# code together.
- Use a build targets file to put files into specific folders within a consuming application.
- Test your package installs and works as an alpha/beta on nuget.org before submitting to the Optimizely NuGet feed.
- Upload your package to [nuget.optimizely.com](https://nuget.optimizely.com) when it is ready.