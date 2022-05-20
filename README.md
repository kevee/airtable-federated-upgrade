# Federated Airtables

Maintaining an application in Airtable across multiple accounts with their own changes to table schema requires manual labor. Let's [create a simple human resources app](https://airtable.com/shr2EB3RyAgZVhwDJ) with the following structure:

- **People**
  - **Name** - Name of person, single-line text
  - **Status** - Employment status, single-select
  - **Department** - A single reference to _Departments_
- **Departments**
  - **Name** - Department name, single-line text
  - **Description** - A note about the department's responsibilities, multi-line text
  - **People** - A multi-reference field to _People_

We deploy this app to two clients, [Client A](https://airtable.com/shrMgs2iuljRypyMy) and [Client B](https://airtable.com/shrdB1k2OI5zx9Mkt). They have their own instances of Airtable, but they give us [Creator](https://support.airtable.com/hc/en-us/articles/202887099-Permissions-overview) access to their base (See note at bottom about API security).

A few changes have been made for each client that deviate from the above schema:

**Client A**

- **People**
  - **Email** - Added a new email field
- **Departments**
  - **Overtime allowed** - Created a new percent field, but have not added any values

**Client B**

- **People**
  - **Status** - Added different options for this single-select field
- **Departments**
  - **Description** - Changed from multi-line text to a button that references a new field, _Description Link_

Client A was on our beta program to add the email field, which we want to roll out to all our clients.

## Challenges with the data API

There are a few challenges with maintaining schema integrity across multiple Airtable bases using the traditional data API:

- **Incomplete Metadata API** - Airtable has a [Metadata API](https://airtable.com/api/meta) that is currently in beta. Unless you are on Enterprise-level or above, getting access to it requires asking permission. The API is also read-only, there is no way to update tables or columns.
- **Columns only exist in the API if they have data** - The data API only returns fields with data. In the example of Client A adding but never using the _Overtime percent_ field, we will never know through the API that the field exists.

## Airtable Apps

Using Airtable apps along with a centralized storage of table and field IDs across clients allows you to generate a deployment spec from an Airtable base, then deploy that spec along with the app to all users. Airtable apps get the same level of access as the user who is logged in, and as of recently you can [run and release apps to multiple bases](https://www.airtable.com/developers/apps/guides/run-in-multiple-bases) without adding them to the marketplace.

### Table and field ID base

Because clients can rename tables and fields, we need to map those values in a centralized location. This requires some manual work for pre-existing clients, since a human needs to validate what fields map to what. Luckily the [API interface](https://airtable.com/api) for each base and table includes a handy map of table and fields to their IDs.

For future clients, we can generate these mappings automatically using a custom Airtable app.

We can store these in a [centralized mapping base](https://airtable.com/shrP5KnHUNnWJl65T) that maps "Source fields" to "Client fields" and expose its data through a private API (`./field-mapping` is a quick tool that outputs a JSON object, could move to a web-based API easily). We also store what version of the app is running for every client.

### How it works

#### Generate a deployment file

We add a **Deployment builder** app to our "main" base and then make whatever changes we want to propogate out to client bases. Proof-of-concept code is available in this repo at `./deployment-builder-block`, that lets a user generate a deployment JSON object. This object can be versioned and checked into a repository. An example deployment object is in the `./deployments/` directory.

A much better implementation would have an interface for the current user to compare a base against the latest deployed version, add additional notes about the release, and set changes as required or optional for a version.

#### Preview upgrade on the client's base

We add an **Upgrade** app to each client's base. This app first checks that the user has permissions to edit the schema of tables, then prompts them to upgrade if the base is not up-to-date.

The app gives a preview of all the things that will happen to the base once the upgrade is started. It finally changes the base tables and fields and reports the results of the upgrade

#### Upgrade is done

Once the upgrade is done, any changes, and especially new fields, are put back into the centralized mapping Airtable base that tracks field IDs through the standard Airtable Data API.

## Note about security and API access

Because Airtable has only user-level API tokens, the most secure way to manage access to all federated bases is to create an API-only user, basically a robot account, which a human never logs into and who's keys are cycled frequently.
