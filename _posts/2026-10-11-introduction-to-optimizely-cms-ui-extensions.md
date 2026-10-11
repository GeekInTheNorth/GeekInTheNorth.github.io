---
layout: post
title: "An Introduction to Optimizely OCP CMS UI Extensions"
description: "An introduction to building OCP CMS UI Extensions for Optimizely SaaS CMS"
permalink: "/article/introduction-to-optimizely-cms-ui-extensions"
category:
  - Development
  - Optimizely
image: "https://www.stott.pro/assets/stott-security-saas-preview-screen.png"
promoImage: "/assets/stott-security-saas-preview-screen.png"
promoImageAlt: "Stott Security for SaaS CMS, a CMS UI Extension built and hosted within OCP."
relatedArticles:
  - "_posts/2026-08-13-introducing-stott-security-for-saas.md"
---

## Introduction

Developers have been using add-ons to extend the functionality of Optimizely PaaS CMS for years.  These have been built using C# and deployed as NuGet packages. Where you have control of the code for the CMS, this is the optimum approach for seamless integration.  As Optimizely SaaS CMS becomes a more common approach for composable architecture, the way we extend the CMS has had to change.

A CMS UI Extension is an application built in **node** and **JavaScript** that is deployed into the Optimizely Connect Platform (OCP).  From there, your app can be installed into any SaaS CMS that is within your organisation. There are currently three ways that your CMS UI Extension can manifest within your SaaS CMS:

- **Sidebar**: Appears within the CMS editor interface within a panel mounted to the right-hand side of the screen.
- **View**: Mounts a standalone full-width page that is accessed via the Extensions option in the left-hand menu.
- **Property Editor**: Replaces the built-in editor for a single content property of a declared type.

## Setting Up Your Environment

In order to develop applications for OCP, you must be an Optimizely Partner or Customer and you must have Developer access to an OCP environment.  If you have access to OCP already, you may still need to raise a ticket with Optimizely Support to gain access as a Developer.

Once you have access to the Developer Portal in OCP, you can generate an API key which you will use with the OCP CLI.  You should save this within a credentials file on your device as `~/.ocp/credentials.json` and then install the OCP CLI:

Windows:
```Powershell
# Create the folder
New-Item -Path "~/.ocp" -Name "home dir" -ItemType "directory"

# Create the credentials file
Write-Output '{"apiKey": "<your-api-key>"}' | out-file "~/.ocp/credentials.json" -encoding utf8

# Install OCP CLI
iwr -useb https://cli.ocp.optimizely.com/install.ps1 | iex
```

Mac:
```Bash
# Create the folder
mkdir ~/.ocp (home dir)

# Create the credentials file
echo '{"apiKey": "<your-api-key>"}' > ~/.ocp/credentials.json

# Install OCP CLI
curl -fsSL https://cli.ocp.optimizely.com/install.sh | bash
```

You should then be able to verify access with the whoami command:

```Bash
ocp accounts whoami
```

## Before Building Your Solution

Before you get started with building your application you should look at installing the [Optimizely OCP Skills](https://github.com/optimizely/ocp-skills/) for your AI coding assistant.  Whether you clone these into your own repo or install them as a plugin is going to be your own decision.  It does come with 4 skills, 2 of which are migration skills. If you are new to OCP app development, you can focus on the **ocp-app-development** and **ocp-local-testing** skills.

Optimizely have also created a sample OCP CMS UI Extension called [Unsplash Viewer](https://github.com/optimizely/unsplash-viewer-cms-ui-extension-ocp-app) that has both a `sidebar` panel and a full-page `view`.  It is worth looking at this sample repository to see how the two entry points are configured and to understand the general architecture of a CMS UI Extension.

## Thinking About Data

When building add-ons for Optimizely PaaS CMS, you had access to your own tables within the CMS database through tooling such as Entity Framework or by using the [Dynamic Data Store](https://docs.optimizely.com/cms-12/docs/dynamic-data-store).  These options are not available to us when building CMS UI Extensions.  OCP does however provide access to the following data stores which are key-value pairs:

- **Secrets Store**: Allows the storing of primitive data types only and is your general purpose storage for sensitive data such as API keys.  This store is accessible from the backend of your OCP application.
- **Settings Store**: Allows the storing of primitive data types only and is the preferred place to store application settings, including sensitive data such as API keys.  This data store can be accessed either by the backend of your application or as the settings form directly with the application settings within OCP.
- **Key Value Store**: Allows the storing of primitive data types and complex JSON objects for short-term and long-term storage. Do not store sensitive data here. This data store is typically accessed by the backend of your application.
- **Shared Key Value Store**: Works like the Key Value Store, but is accessible by both your application and third-party applications.

If you are planning to store a lot of data to the Key Value Store, consider co-locating the data as a JSON object.  Each entry in the Key Value Store can be up to 400 KB in size and storing data together can reduce the number of API calls needed by your application.

If the data you are storing to the Key Value Store is intended to have a limited lifespan, the data should be saved with a TTL (Time to Live).  Data saved without a TTL will have a lifespan limited to the application installation.  If you need to reinstall your CMS UI Extension, all of its data is removed when you uninstall it, and the reinstalled app starts with an empty store.

If you have a requirement for data permanence that extends beyond this, then you will need to consider alternative options such as:

- Using SDKs to store your data in Content Graph or as content.
- Using a third-party data store accessible via API using an API key stored within the Settings Store.

## Reviewing the Stott Security for SaaS CMS Solution

Stott Security for SaaS CMS is a CMS UI Extension port of the popular [Stott Security](/article/list/stott-security) add-on for Optimizely PaaS CMS.  This has been built as a full-width page with a publicly accessible endpoint to be consumed by a separate headless frontend.

![The Response headers tab of Stott Security for SaaS CMS, showing standard security headers with behaviour, value and preview options.](/assets/stott-security-saas-response-headers-screen.png)

### Solution Structure

The following is a folder and file structure for the Stott Security for SaaS CMS solution.  I'm only including core files here to prevent information overload, but do check out my solution or the Optimizely Unsplash Viewer example.

```
- assets
  - icon.svg
  - logo.png
  - directory
    - overview.md
- forms
  - settings.yml
- src
  - backend
    - functions
      - CmsExtension.ts
      - CompiledHeaders.ts
  - cms-ui-extensions
    - SecurityConsole.view.tsx
- app.yml
```

You may notice that the code is split into two separate runtimes, the backend and the CMS UI Extensions:

- Frontend
  - Runs within an iFrame hosted within Optimizely CMS
  - Code lives in `src/cms-ui-extensions/`
  - Talks to the backend through `context.extension.invokeFunction()`
  - Exposes endpoints through `ExtensionContext`
- Backend
  - Runs on OCP in the `node22-cms-ext` context
  - Code lives in `src/backend/`
  - Talks to
    - External APIs over HTTPS
    - OCP storage
    - Lifecycle APIs

### Understanding the app.yml

The app.yml file contains the manifest for your CMS UI Extension.  You can see the full YAML file for this solution on [GitHub](https://github.com/GeekInTheNorth/Stott.Security.Optimizely.SaaS).  The metadata for the application and all of its entry points and functions are declared within this file.

```YML
meta:
  app_id: stott_security_saas
  display_name: Stott Security
  vendor: mark_stott
  summary: Manage Content Security Policy and response headers for Optimizely CMS (SaaS).
  categories:
    - Content Management
  availability:
    - all

runtime: node22-cms-ext

ui_extensions:
  view:
    - name: stott-security-console
      entry_point: SecurityConsole
      display_name: Stott Security

functions:
  cms_extension:
    entry_point: CmsExtension
    description: Backend for the Stott Security console (draft CRUD and publish).
    accepts: cms_ui_extension

  compiled_headers:
    entry_point: CompiledHeaders
    description: Serves compiled security headers to the site head.

```

- **app_id**: This must be a globally unique name for your application and it is permanent. Changing this name is essentially publishing the application a second time.
- **vendor**: This is your vendor name and must match the vendor associated with your partner or customer organisation.
- **runtime**: This must be `node22-cms-ext` for a CMS UI Extension and tells OCP that this application will be run in the CMS Extensions runtime operating on Node.js 22.
- **ui_extensions**: This is where you declare your entry points into the CMS and can be declared as:
  - **view**: A full-width embedded page.
  - **sidebar**: A sidebar embedded in a panel on the right-hand side of the editor interface.
  - **property-editor**: A replacement UI for a specific property type.
- **functions**: This is where you declare your backend functions.
  - **entry_point**: This is the name of your entry point.
  - **accepts**: If you set this to `cms_ui_extension`, then it means the endpoint has no public URL and can only be accessed by the frontend using the `invokeFunction()` method.  Omit this if you want to provide a public endpoint.

### Backend

Each function declared within the `functions` section of your `app.yml` has a matching entry file within `src/backend/functions/`.  The `entry_point` must match the name of the exported class, and that class must extend `App.Function` from the `@zaiusinc/app-sdk` package and implement a `perform()` method that returns an `App.Response`.  One thing to watch out for is that the status code is the **first** argument for `App.Response`, which is the opposite of the standard web `Response` object.

```TypeScript
import * as App from '@zaiusinc/app-sdk';

export class HelloWorld extends App.Function {
  public async perform(): Promise<App.Response> {
    return new App.Response(200, { message: 'Hello World' });
  }
}
```

Stott Security for SaaS CMS has two backend functions, one private and one public.

#### CmsExtension.ts

This is the private backend for the security console.  Because it is declared with `accepts: cms_ui_extension`, it has no public URL and can only be called by the frontend using `context.extension.invokeFunction()`.  Rather than creating a function per operation, the convention is to have a single function that accepts an `action` and a set of `params` and then switches on the action:

```TypeScript
export class CmsExtension extends App.Function {
  public async perform(): Promise<App.Response> {
    const body = (this.request.bodyJSON ?? {}) as RequestBody;
    const action = typeof body.action === 'string' ? body.action : '';
    const params = body.params ?? {};

    switch (action) {
      case Actions.GetDraft:
        return ok(await this.getDraft(params));

      case Actions.SaveDraft:
        return ok(await this.saveDraft(params));

      case Actions.Publish:
        return ok(await this.publish(params));

      // ... additional actions

      default:
        return fail(400, ErrorCodes.UnknownAction, `Unknown action '${action}'.`);
    }
  }
}
```

This function is responsible for reading and writing the draft configuration, validating it, compiling it into a set of headers and then publishing the compiled headers.  All of the data is held as JSON documents within the Key Value Store using `storage.kvStore` from the app SDK.  Saving a draft and publishing are deliberately separate actions as an incorrect Content Security Policy can break a website, so making changes live should be an explicit act by the user.

Every response is wrapped in a consistent envelope of `{ ok: true, result }` or `{ ok: false, error, message }` so that the frontend has a single and predictable way of handling success and failure.

The function also uses `functions.getEndpoints()` to resolve the public URL of the `compiled_headers` function for the current installation.  This allows the console to show the editor exactly which URL their website should consume.

#### CompiledHeaders.ts

This is the public endpoint that the head of the website calls in order to retrieve the published security headers.  As `accepts` is omitted within the `app.yml`, OCP gives this function a public URL which contains a unique identifier for the installation.  This matters because a regular `App.Function` resolves the installation from that URL and can therefore read the same Key Value Store that `CmsExtension` writes to.  If this were declared as a global function, it would have no installation context and could only reach the Shared Key Value Store.

```TypeScript
export class CompiledHeaders extends App.Function {
  public async perform(): Promise<App.Response> {
    if (this.request.method !== 'GET') {
      return new App.Response(405, { error: 'Only GET is supported.' });
    }

    try {
      const compiled = await readCompiled(scope);

      return new App.Response(200, {
        headers: compiled?.headers ?? [],
        publishedAt: compiled?.publishedAt ?? null,
        cacheSeconds: CACHE_SECONDS
      });
    } catch (error) {
      logger.error(`Failed to read compiled headers: ${String(error)}`);

      return new App.Response(503, { error: 'Compiled headers are temporarily unavailable.' });
    }
  }
}
```

A few design decisions are worth highlighting here:

- The endpoint only reads the **compiled** headers, all of the work to compile the configuration happens once on publish rather than on every request.
- The response includes a `cacheSeconds` value to encourage the consuming website to cache the response.  Without this, every page request on the head would result in a request to OCP.
- Having nothing published yet returns an empty array with a `200` status so the head can apply its own defaults, while a genuine failure returns a `503` so the head can tell the difference and fall back gracefully.
- The response contract is identical to the compiled headers endpoint in the PaaS version of Stott Security, allowing a single consumer implementation to work with either product.
- The endpoint is anonymous by design.  These headers are visible on every response from the website anyway, but this is a deliberate decision and you should consider carefully what data you expose from any public function.

> Please note that I will cover consuming this endpoint in a headless solution in a future article so as to not detract from the topic of this article.

### Frontend

Each entry within the `ui_extensions` section of your `app.yml` has a matching entry file within `src/cms-ui-extensions/`.  For Stott Security for SaaS CMS, this is a single `view` with an entry point of `SecurityConsole`, which maps to `SecurityConsole.view.tsx`.  The frontend is built with React and is rendered within an iFrame inside of the CMS.

#### SecurityConsole.view.tsx

The most important line in this file is at the very bottom.  The `register()` method from the `@optimizely/cms-extensibility-sdk` package is how your extension is mounted into the CMS.  This must be called exactly once at the top level of the module and never inside of a component or effect.  The CMS passes an `ExtensionContext` into the callback, which you then pass down into your components:

```TypeScript
import { register, type ExtensionContext } from '@optimizely/cms-extensibility-sdk';

function SecurityConsole({ context }: { context: ExtensionContext }): React.JSX.Element {
  useEffect(() => {
    void context.extension.setReady();
  }, [context]);

  // ... render the console
}

register((context) => <SecurityConsole context={context} />);
```

The `ExtensionContext` is your bridge between the frontend and both the CMS and your backend.  Within the console, this is used for two key purposes:

- `context.extension.setReady()` is called once the component has mounted to let the CMS know that the extension has loaded.
- `context.extension.invokeFunction()` is used to call the private `CmsExtension` backend function.

All backend calls are wrapped within a small typed client, so the components never need to know about the transport:

```TypeScript
const result = await context.extension.invokeFunction('cms_extension', { action, params });
```

A nice benefit of this approach is that there are no URLs, authentication cookies, CORS rules or CSRF tokens to manage within the frontend.  The call never leaves the CMS host and OCP takes care of routing it to your backend function.  It is worth noting that `invokeFunction()` will only reject on a transport failure, application errors are returned as a normal response with a non-2xx status code, so you will want to handle both.

The rest of the file is a fairly standard React component.  The UI is built with [Optimizely Axiom](https://www.npmjs.com/package/@optiaxiom/react) (`@optiaxiom/react`), which is Optimizely's own design system, and helps the extension look and feel like a native part of the CMS.  Every Axiom component reads its design tokens from the `AxiomProvider`, so this needs to wrap your entire extension or the components will render unstyled.

```TypeScript
function Shell({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <AxiomProvider>
      <main>{children}</main>
    </AxiomProvider>
  );
}
```

There are a few other things to be aware of when building a `view`:

- A `view` is a single mounted bundle, so navigation between the Response Headers, Content Security Policy, Permissions Policy, Preview and Tools screens is managed using component state and tabs rather than a client-side router.
- The CMS already renders a title for your extension, so there is no need to repeat it within your own UI.  I have used this space for a sticky toolbar containing the publish status and the Save and Publish buttons.
- The `ExtensionContext` does not currently carry the identity of the user, so you cannot rely on it for attributing actions to a named editor.

### App Directory Information

The assets folder of your repository is used to provide additional information for when your app is added to the app directory:

- `assets/logo.png` and `assets/icon.svg` provide a logo to be used
- `assets/directory/overview.md` provides a description of the application directly visible in OCP.

![The CMS UI Extensions application detail screen within OCP.](/assets/ocp-cms-ui-extensions-1.png)

### Application Settings

Your app must have a `forms/settings.yml` which is used to declare the settings form within OCP for your app.  This allows you to manage data within the Settings Store for your installation of the app directly within OCP.

As Stott Security for SaaS CMS does not require any data from the Settings Store, my entry contains a single information entry:

```YML
sections:
  - key: about
    label: Stott Security
    elements:
      - type: instructions
        text: >
          Everything is configured in the security console...
```

Other options you can add to your settings.yml include the following, you can see a full description and examples of each option by viewing [OCP Form Elements](https://docs.optimizely.com/optimizely-connect-platform/docs/form-elements-ocp2):

- **Toggle**: An option you can toggle on or off. 
- **Text**: A plain input box, additional options can be set to change the input type to text, email, number or phone.
- **Secret**: A secure field for sensitive data that will be displayed as asterisks.  Data added to one of these fields cannot be retrieved through the settings form interface.
- **Select**: A single-select field that renders differently based on the number of options:
  - 1 option is rendered as a toggle.
  - 2-3 options are rendered as a radio group.
  - 4+ options are rendered as a dropdown.
- **Multi-Select**: A multi-select field that renders differently based on the number of options:
  - 1-3 options are rendered as a collection of switches.
  - 4+ options are rendered as a multi-select dropdown.
- **Button**: Allows for an action to be triggered within the form e.g. "Begin Integration"
- **Link Button**: Allows for a link to an external URL and supports Mustache syntax for URL variation.
- **OAuth Button**: Supports authentication with a third party in order to support integrations.
- **Divider**: Renders a simple divider mid-form.
- **Instructions**: Supports instructions to be displayed to the user written in Markdown.

## Summary

CMS UI Extensions are a significant leap forward for Optimizely SaaS CMS.  For the first time, we can extend the SaaS editor interface in the same way that we have been extending PaaS CMS with add-ons for years, whether that is a full-width tool, a sidebar that works alongside the editor or a custom property editor.

The technology choice also makes a lot of sense.  CMS UI Extensions are built with Node.js, TypeScript and React, which are the same tools that developers building headless solutions on SaaS CMS are already using every day.  This means the barrier to entry is low for the teams most likely to want to build them. 

There are still some challenges to work through.  Data storage is limited to key value stores that are tied to the lifespan of the application installation, so anything that needs to outlive a reinstall requires some careful thought.  As this is a new feature, best practices are also still emerging.

Overall, CMS UI Extensions are a really good addition to Optimizely SaaS CMS, and I'm looking forward to seeing what the community builds with them. If you are about to build your first CMS UI Extension, here are a few tips to help you get started:

- Install the [Optimizely OCP Skills](https://github.com/optimizely/ocp-skills/) as this will help your AI assistant to structure your application correctly.
- Review Optimizely's example CMS UI Extension: [Unsplash Viewer](https://github.com/optimizely/unsplash-viewer-cms-ui-extension-ocp-app)
- Consider app ownership and naming very carefully. App names must be unique and are permanent.
- Consider whether you need data permanence and where that data will live.
- Build for performance and leverage caching wherever possible.
- If you are using the Key Value Store, co-locate your data as JSON to reduce the number of API calls.

## Appendix

- [Optimizely Docs : CMS UI extensions](https://docs.optimizely.com/optimizely-connect-platform/docs/cms-ui-extensions-ocp2)
- [Optimizely Docs : Get started with the OCP developer platform](https://docs.optimizely.com/optimizely-connect-platform/docs/get-started-with-the-ocp2-developer-platform)
- [Optimizely Docs : Configure your OCP development environment](https://docs.optimizely.com/optimizely-connect-platform/docs/configure-your-development-environment-ocp2)
- [Optimizely Docs : OCP Form Elements](https://docs.optimizely.com/optimizely-connect-platform/docs/form-elements-ocp2)
- [GitHub : Optimizely OCP Skills](https://github.com/optimizely/ocp-skills/)
- [GitHub : Unsplash Viewer](https://github.com/optimizely/unsplash-viewer-cms-ui-extension-ocp-app)
- [GitHub : Stott Security for SaaS CMS](https://github.com/GeekInTheNorth/Stott.Security.Optimizely.SaaS)