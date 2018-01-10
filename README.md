# Two-factor Auth Syncano Socket

This socket integrates two-factor authentication to syncano.

### Install
```
syncano-cli add two-factor-auth
```

### Dependent Socket
* **rest-auth socket**
    
    Since there can be no authentication without first registering to a system, it is important to use the `rest-auth` socket for basic registration.

    [Link to rest-auth socket documentation](https://syncano.io/#/sockets/two-factor-auth)

### Socket Documentation
[Link to two-factor-auth socket documentation](https://syncano.io/#/sockets/two-factor-auth)


### Demo
Demo web app [repo](https://github.com/Syncano/synacno-react-demo-two-factor-auth-socket) using two-factor-auth socket

## Endpoints
#### setup-two-factor
This endpoint sets up two-factor authentication for logged in user.

*_Parameters_*

| Name          | Type           | Description  | Example
| ------------- |--------------| ------------| ---------
| username      | string         | User email        | you@domain.com
| token         | string         | User token        | cb21fac8c7dda8fcd0129b0adb0254dea5c8e

*_Response_*

On success it returns the otpURL and dataURL(image url) for QR code.
The `dataURL` is the image url in base64 which is expected to be used to display a Google Authenticator–compatible QR code 
which can be scanned by a two-factor app like 
[Google Authenticator](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en)

```
{
  message: "Verify OTP",
  tempSecret: "LBGDOZBIKARWIRZI",
  otpURL: "otpauth://totp/SecretKey?secret=LB",
  dataURL: "data:image/png;base64,iVBORw0KGgoAAAANS"
}
```

#### verify-token
This endpoint Verifies a two-factor token before enabling two-factor authentication on a user account to prevent locking user

*_Parameters_*


| Name          | Type      | Description  | Example
| ------------- |-----------| ------------| ---------
| username      | string    | User email        | you@domain.com
| token         | string    | User token        | cb21fac8c7dda8fcd0129b0adb0254dea5c8e
| two-factor-token | string | One-time passcode | 897900

*_Response_*

```
{
  message: "Two-factor authentication enabled"
}
```

#### check-two-factor
This endpoint checks if two factor authentication is enabled on user account.
This helps to determine on the client side if the option to setup or disable two-factor authentication will be made available to user

*_Parameters_*


| Name          | Type      | Description  | Example
| ------------- |-----------| ------------| ---------
| username      | string    | User email        | you@domain.com
| token         | string    | User token        | cb21fac8c7dda8fcd0129b0adb0254dea5c8e

*_Response_*

```
{
  message: "Two-factor authentication is enabled on user account",
  is_two_factor: true
}
```

#### login
This endpoint logs in a user and supports both, normal auth and two-factor authentication
User with two-factor auth enabled will be required to input *two-factor token* along with *username* and *password*

*_Parameters_*


| Name          | Type      | Description  | Example
| ------------- |-----------| ------------| ---------
| username      | string    | User email        | you@domain.com
| password         | string    | User password  | abcdefgh
| two-factor-token | string | One-time passcode| 897900

*_Response_*

```
{
  token: "cb21ff98ac8c7dda8fcd01",
  username: "you@domain.com"
}
```

#### disable-two-factor
This endpoint disables two-factor authentication on user account

*_Parameters_*


| Name          | Type      | Description  | Example
| ------------- |-----------| ------------| ---------
| username      | string    | User email        | you@domain.com
| token         | string    | User token        | cb21fac8c7dda8fcd0129b0adb0254dea5c8e
| two-factor-token | string | One-time passcode | 897900

*Response*

```
{
  message: "Two-factor authentication disabled"
}
```
