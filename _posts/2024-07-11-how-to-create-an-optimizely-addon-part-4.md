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


```
<Project Sdk="Microsoft.NET.Sdk.Razor">
  <PropertyGroup>
    <TargetFrameworks>net6.0;net8.0</TargetFrameworks>
    <AddRazorSupportForMvc>true</AddRazorSupportForMvc>
    <Version>2.7.0.0</Version>
    <RepositoryUrl>https://github.com/GeekInTheNorth/Stott.Security.Optimizely</RepositoryUrl>
    <PackageProjectUrl>https://github.com/GeekInTheNorth/Stott.Security.Optimizely</PackageProjectUrl>
    <PackageLicenseFile>LICENSE.txt</PackageLicenseFile>
    <Authors>Mark Stott</Authors>
    <Description>Provides an administration interface in Optimizely CMS 12 for managing security response headers.</Description>
    <Copyright>Mark Stott 2024</Copyright>
    <PackageTags>Optimizely;CMS;Optimizely CMS;Security;CSP;Content Security Policy;CORS;Cross-Origin Resource Sharing</PackageTags>
    <PackageRequireLicenseAcceptance>true</PackageRequireLicenseAcceptance>
    <RepositoryType>git</RepositoryType>
    <PackageReadmeFile>README.md</PackageReadmeFile>
    <AssemblyVersion>2.7.0.0</AssemblyVersion>
    <GeneratePackageOnBuild>True</GeneratePackageOnBuild>
    <PackageOutputPath>D:\Repos\Nuget</PackageOutputPath>
    <PackageReleaseNotes>Add a preview widget to the CMS Edit interface and some quality of life UI enhancements.</PackageReleaseNotes>
    <Nullable>enable</Nullable>
    <Title>Stott Security</Title>
  </PropertyGroup>
```

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

```
<?xml version="1.0" encoding="utf-8" ?>
<module loadFromBin="true" clientResourceRelativePath="" viewEngine="Razor" authorizationPolicy="Stott:SecurityOptimizely:Policy" moduleJsonSerializerType="None" prefferedUiJsonSerializerType="Net">
  <assemblies>
    <add assembly="Stott.Security.Optimizely" />
  </assemblies>

  <clientModule>
    <moduleDependencies>
      <add dependency="CMS" />
    </moduleDependencies>
  </clientModule>
</module>
```

```
<ItemGroup>
  <None Include="module.config">
    <Pack>true</Pack>
    <PackagePath>contentFiles\module.config</PackagePath>
  </None>
</ItemGroup>

<ItemGroup>
  <None Include="msbuild\copyfiles.targets">
    <Pack>true</Pack>
    <PackagePath>build\$(MSBuildProjectName).targets</PackagePath>
  </None>
</ItemGroup>
```

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

Notes:

- Reference Parts One & 2
- Controller Attributes and UI
