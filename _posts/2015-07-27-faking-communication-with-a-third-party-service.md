---
layout: post
title: "Testing Solutions: Faking Communication with a Third Party Service"
description: "Creating a test service to allow testers to maintain and vary shared test data for testing integrations to the HMRC test servers within a payroll application."
permalink: "/article/faking_communication_with_a_third_party_service"
category:
  - Development
---

# Testing Solutions: Faking Communication with a Third Party Service

One of the problems in performing Quality Assurance for a system that communicates with a third party service is that it can be hard to test to an acceptable level of confidence.  As a payroll provider, we have to provide functionality for sending and receiving employee updates from the HMRC to the customer and this functionality is a pain to test.

The source code for the final product can be found here: [HmrcDpsTestServer](https://github.com/GeekInTheNorth/HmrcDpsTestServer)

## Background

The HMRC Outgoing Data Provisioning Service (DPS) is the service that we have to communicate with; Through the front end of our application the user provides their user credentials and we use that to obtain the latest messages from the HMRC.  These messages include the following:

- Tax Code Notice (P9 or P6)
- Student Loan Notice (SL1 or SL2)
- Annual Reminders (AR)
- Notifications (NOT)

Our system has to send a series of SOAP requests to the HMRC Service, the first request is to authenticate the user, all subsequent requests are to obtain data.  The HMRC does provide us with their Third Party Validation Service (TPVS), however the data the TPVS provides is totally outside of our control and employee identifiers are not necessarily compatible with our own.  For example we use an integer as an identifier for an employee's employment record, often the test data provides alphanumeric strings.  A second issue comes from the data that is provided, our QA specialists don't have any control over the data to create their edge case scenarios.

## Test Data & Test Pages

The first step taken to deal with this issue was to create our own collection of test messages with a rich set of edge cases.  This was done in collaboration with our payroll QA expert, they provided an excel file containing their scenarios and I converted those into XML files matching the format provided by the HMRC.

I then created a web-page that allowed the QA person to import the test files that we had previously created.  This page circumnavigated the logic to communicate with the HMRC server, but it plugged into the rest of the logic including the de-serialisation of messages, matching them to employees and saving the messages.

This worked as an interim solution, however as we improved on our processes our QA people were not confident with testing the functionality using this as it did not allow for full end to end testing.  So another solution was sought.

## Test & Proxy Server

It was suggested by the team that in order to test our functionality end to end, we should have a test site that our software communicates with instead of the HMRC TPVS.  So I set myself a task to see if this was a viable option with the following two options for data return in mind:

- A service which provides test files constructed with our QA personnel.
- A proxy service that forwards requests on to the HMRC TPVS and then alters the response with a pre-defined set of employee identities.

I started off at the business logic layer for this site, I added all my test files to a resource file and made a simple parser (requestTypeResolver) which would identify the type of request being made by looking at selected nodes in the XML document and then return an enumerated value.  I added another class (responseFileRetriever) whose responsiblity was to retun a test file based on the aforementioned enumerated value.  Taking an XML file and determining which file to return turned out to be the easy part.

```
public XmlDocument GetResponseFor(XmlDocument request)
{
    var requestType = requestTypeResolver.GetRequestType(request);
    var response = responseFileRetriever.GetResponse(requestType);

    return response;
}

public string GetResponseFor(string request)
{
    var requestXml = new XmlDocument();
    if (!string.IsNullOrWhiteSpace(request))
        requestXml.LoadXml(request);

    var response = GetResponseFor(requestXml);

    return GetXmlDocumentAsString(response);
}

private string GetXmlDocumentAsString(XmlDocument xml)
{
    using (var stringWriter = new StringWriter())
    {
        using (var xmlTextWriter = XmlWriter.Create(stringWriter))
        {
            xml.WriteTo(xmlTextWriter);
            xmlTextWriter.Flush();
            return stringWriter.GetStringBuilder().ToString();
        }
    }
}
```

Creating a web service to receive the request from the payroll client turned out to be the trickiest part of this.  I initially tried wrapping this up in a Web Service as an asmx file, our payroll client didn't work well with this and after a few hours of banging my head against a wall I decided to try something newer.

I decided to create my first Web API method and it turned out to be much easier. I found that request content would be part of a HttpRequestMessage and I could wrap up the response file in a HttpResponseMessage.  I was worried that I would have to somehow target the method on the controller, however it turned out that I didn't need to do that, I just had to decorate the method to accept POST requests.

```
public class TestDataController : ApiController
{
    [AcceptVerbs("POST")]
    public HttpResponseMessage GetData(HttpRequestMessage request)
    {
        var content = request.Content;
        var xmlContent = content.ReadAsStringAsync().Result;

        var requestTypeResolver = new RequestTypeResolver();
        var responseFileRetriever = new ResponseFileRetriever();
        var service = new CascadeEdgeCaseService(requestTypeResolver, responseFileRetriever);

        var message = service.GetResponseFor(xmlContent);

        return new HttpResponseMessage
        {
            Content = new StringContent(message, Encoding.UTF8, "application/xml")
        };
    }
}
```

With the Web API successfully returning our test files to the Payroll Client as if it had contacted the HMRC server, I decided to be a little more bold.  I copied the posting logic from our payroll client and added two new controllers, one for the user authentication process with the HMRC server and a second for sending and receiving XML files.  At first I just had my Web API acting as a proxy service to the HMRC TVPS and this seemed to work easily enough.

So then I set about creating a data manipulator which would cycle through each employee in the response file from the HMRC in order to change the National Insurance Number and Works Number into something that would be recognised by our Payroll Client.

```
public string ApplyEmployeeIdentities(string response)
{
    var xmlResponse = new XmlDocument();
    xmlResponse.LoadXml(response);

    var validRequestTypes = new List&lt;RequestType&gt; {RequestType.P6, RequestType.P9, RequestType.SL1, RequestType.SL2};
    var requestType = requestTypeResolver.GetRequestTypeForResponse(xmlResponse);

    if (!validRequestTypes.Contains(requestType))
        return response;

    switch (requestType)
    {
        case RequestType.P6:
            UpdateIdentities(xmlResponse, "CodingNoticesP6P6B");
            break;
        case RequestType.P9:
            UpdateIdentities(xmlResponse, "CodingNoticeP9");
            break;
        case RequestType.SL1:
            UpdateIdentities(xmlResponse, "StudentLoanStart");
            break;
        case RequestType.SL2:
            UpdateIdentities(xmlResponse, "StudentLoanEnd");
            break;
    }

    return GetXmlDocumentAsString(xmlResponse);
}

private void UpdateIdentities(XmlDocument xmlResponse, string messageNodeName)
{
    var identities = repository.Get().ToList();
    var nodes = xmlResponse.GetElementsByTagName(messageNodeName);

    for (var loop = 0; loop < nodes.Count; loop++)
    {
        if (loop >= identities.Count)
            break;

        var node = nodes.Item(loop);
        foreach (XmlNode childNode in node.ChildNodes)
        {
            if (childNode.Name == "NINO") childNode.InnerText = identities[loop].NationalInsuranceNo;
            if (childNode.Name == "WorksNumber") childNode.InnerText = identities[loop].EmployeePayId.ToString();
        }
    }
}
```

With this completed, it would now allow the QA people to test this feature in our software in either of the following ways by simply changing the URLs stored in the client database:

- Full end to end testing with data constructed in house
- Full end to end testing with HMRC TPVS data matched to our test data
- Full end to end testing with HMRC TPVS unaltered data

This puts us in a much stronger position in respect of testing this feature and I got to learn something in the process.  Fantastic!