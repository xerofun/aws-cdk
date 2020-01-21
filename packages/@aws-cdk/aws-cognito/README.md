## Amazon Cognito Construct Library
<!--BEGIN STABILITY BANNER-->

---

![Stability: Experimental](https://img.shields.io/badge/stability-Experimental-important.svg?style=for-the-badge)

> **This is a _developer preview_ (public beta) module. Releases might lack important features and might have
> future breaking changes.**
>
> This API is still under active development and subject to non-backward
> compatible changes or removal in any future version. Use of the API is not recommended in production
> environments. Experimental APIs are not subject to the Semantic Versioning model.

---
<!--END STABILITY BANNER-->

This module is part of the [AWS Cloud Development Kit](https://github.com/aws/aws-cdk) project.

### User Pools

User Pools allows creating and managing your own directory of users that can sign up and sign in. They enable easy
integration with social identity providers such as Facebook, Google, Amazon, Microsoft Active Directory, etc. through
SAML.

#### Sign-In Type

These are the various ways a user of your app can sign in. There are 4 options available with the enum `SignInType`:

* USERNAME: Allow signing in using the one time immutable user name that the user chose at the time of sign up.
* PREFERRED\_USERNAME: Allow signing in with an alternate user name that the user can change at any time. However, this
  is not available if the USERNAME option is not chosen.
* EMAIL: Allow signing in using the email address that is associated with the account.
* PHONE\_NUMBER: Allow signing in using the phone number that is associated with the account.

*Default*: USERNAME.

Code sample:

```ts
new UserPool(this, 'myuserpool', {
  // ...
  // ...
  signInType: [ SignInType.USERNAME, SignInType.EMAIL ],
});
```

> Internal Note: Implemented via UserPool UsernameAttributes & AliasAttributes

#### Attributes

These are the set of attributes you want to collect and store with each user in your user pool. Cognito provides a set
of standard attributes that are available all user pools. Users are allowed to select any of these standard attributes
to be required. Users will not be able to sign up without specifying the attributes that are marked as required. Besides
these, additional attributes can be further defined, known as custom attributes.

Custom attributes cannot be marked as required.

[Go here](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html) for more info.

Standard attributes are available via the `StandardAttrs` enum.

Custom attributes can be specified via the `stringAttr` and `numberAttr` methods, depending on whether the attribute
type is either a string or a number. Constraints can be defined on both string and number types, with length constraint
on the former and range constraint on the latter.

Additionally, two properties `mutable` and `adminOnly` properties can be set for each custom attribute. The former
specifies that the property can be modified by the user while the latter specifies that it can only be modified by the
app's administrator and not by the user (using their access token).

*Default*: None of the standard are marked required. For all custom attributes, mutable is true and adminOnly is false.

Code sample:

```ts
new UserPool(this, 'myuserpool', {
  // ...
  // ...
  attributes: {
    required: [ StandardAttrs.address, StandardAttrs.name ],
    custom: [
      stringAttr({ name: 'myappid', minLen: 5, maxLen: 15 }),
      numberAttr({ name: 'callingcode', min: 1, max: 3 }),
    ],
  }
});
```

> Internal note: Implemented via UserPool SchemaAttribute
> Internal note: Follow up - is mutable = false and adminOnly = true allowed?

#### Password Policy

Specify the constrains when users choose their policy. It's possible to specify the minimum length, whether lowercase,
numbers and/or symbols are required, as well as, how long a temporary password is valid.

*Default*: Passwords must be a minimum length of 8, require lowercase, numbers and symbols with a temporary password
validity of 7 days.

Code sample:

```ts
new UserPool(this, 'myuserpool', {
  // ...
  // ...
  passwordPolicy: {
    required: [ PasswordPolicy.LOWERCASE, PasswordPolicy.NUMBERS, PasswordPolicy.SYMBOLS ],
    minLength: 12,
    tempPasswordValidity: Duration.days(3)
  }
});
```

### Federated Identities or Identity Pools

Control access of backend APIs and AWS resources for your app's users. Assign users to different roles and permissions,
and get temporary AWS credentials for accessing AWS services.
