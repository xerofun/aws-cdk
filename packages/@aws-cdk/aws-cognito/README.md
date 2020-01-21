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

#### Sign Up

Users need to either signed up by the app's administrators or can sign themselves up. You can read more about both these
kinds of sign up and how they work
[here](https://docs.aws.amazon.com/cognito/latest/developerguide/signing-up-users-in-your-app.html).

Further, a welcome email and/or SMS can be configured to be sent automatically once a user has signed up. This welcome
email and/or SMS will carry the temporary password for the user. he user will use this password to log in and reset the
password to one of their choice. The temporary password is valid only for a limited number of days.

All of these options can be configured under the `signUp` property. The pool can be configured to let users sign
themselves up by setting the `selfSignUp` property. A welcome email template can be configured by specifying the
`welcomeEmail` property and a similar `welcomeSms` property for the welcome SMS. The validity of the temporary password
can be specified via the `tempPasswordValidity` property.

*Defaults*:
* selfSignUp: true
* tempPasswordValidity: 7 days
* welcomeEmail.subject: 'Thanks for signing up'
* welcomeEmail.body - 'Hello {username}, Your temporary password is {####}'
* welcomeSms.message - 'Your temporary password is {####}'

Code sample:

```ts
new UserPool(this, 'myuserpool', {
  // ...
  // ...
  signUp: {
    selfSignUp: true,
    tempPasswordValidity: Duration.days(3),
    welcomeEmail: {
      subject: 'Welcome to our awesome app!'
      body: 'Hello {username}, Thanks for signing up to our awesome app! Your temporary password is {####}'
    },
    welcomeSms: {
      message: 'Your temporary password for our awesome app is {####}'
    }
  }
});
```

> Internal Note: Implemented via UserPool-AdminCreateUserConfig and temp password UserPool-Policies

#### Sign-In Type

These are the various ways a user of your app can sign in. There are 4 options available with the enum `SignInType`:

* USERNAME: Allow signing in using the one time immutable user name that the user chose at the time of sign up.
* PREFERRED\_USERNAME: Allow signing in with an alternate user name that the user can change at any time. However, this
  is not available if the USERNAME option is not chosen.
* EMAIL: Allow signing in using the email address that is associated with the account.
* PHONE\_NUMBER: Allow signing in using the phone number that is associated with the account.

*Defaults*: USERNAME.

Code sample:

```ts
new UserPool(this, 'myuserpool', {
  // ...
  // ...
  signInType: [ SignInType.USERNAME, SignInType.EMAIL ],
});
```

> Internal Note: Implemented via UserPool-UsernameAttributes and -AliasAttributes

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

*Defaults*:
* No standard attributes are marked required.
* For all custom attributes, mutable is true and adminOnly is false.

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

> Internal note: Implemented via UserPool-SchemaAttribute
> Internal note: Follow up - is mutable = false and adminOnly = true allowed?

#### Password Policy

Specify the constrains when users choose their policy. It's possible to specify the minimum length, whether lowercase,
numbers and/or symbols are required.

*Defaults*:
* minimum length of 8
* require lowercase, numbers and symbols.

Code sample:

```ts
new UserPool(this, 'myuserpool', {
  // ...
  // ...
  passwordPolicy: {
    required: [ PasswordPolicy.LOWERCASE, PasswordPolicy.NUMBERS, PasswordPolicy.SYMBOLS ],
    minLength: 12,
  }
});
```

> Internal: Implemented via UserPool-Policies

#### Security & Account Recovery

User pools can be configured to enable MFA. It can either be turned off, set to optional or made required. Setting MFA
to optional means that individual users can choose to enable it. Phone numbers must be verified if MFA is enabled.
Additionally, MFA can be sent either via SMS text message or via a time-based software token.
[Go here](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa.html) to learn more.

This can be configured by setting the `mfa.enforcement` option under `security` properties to be one of the values in
the `MfaEnforcement` enum. Available values are `REQUIRED`, `OPTIONAL`, `OFF`.
The type of MFA can be configured by its peer property `type` which can be set to a list of values in the enum
`MfaType`. The available values are `SMS` and `SOFTWARE_TOKEN`.

User pools can also be configured to set up account recovery policies, when a user has lost their password or unable to
retrieve their MFA token. [Go
here](https://docs.aws.amazon.com/cognito/latest/developerguide/how-to-recover-a-user-account.html) to learn more about
recovering user accounts.

**INCOMPLETE**

*Defaults*:
* security.mfa.enforcement: OPTIONAL
* security.mfa.type: SMS

Code sample:

```ts
new UserPool(this, 'myuserpool', {
  // ...
  // ...
  security: {
    mfa: {
      enforcement: MfaEnforcement.REQUIRED,
      type: [ MfaType.SMS, MfaType.SOFTWARE_TOKEN ]
    }
  }
});
```

> Internal Note: MFA enable via UserPool-MfaConfiguration; MFA type via UserPool-EnabledMfas

### Federated Identities or Identity Pools

Control access of backend APIs and AWS resources for your app's users. Assign users to different roles and permissions,
and get temporary AWS credentials for accessing AWS services.
