# MDC API

This is deprecated and I'm not really maintaining it as it needs to be replaced.

To make it easier for folks to run  the containers, headless chrome etc. I have
pushed it to docker compose to make it a bit easier to get it setup yourself
should you wish to run it

This is WIP so expect some issues though I believe it's fully functional from
PDF/PNG Zip downloads and admin interface

## Admin Interface

Navigate to URL/admin and you should be able to login

## Creating users

As this was not built into the admin interface yet, I have made it so that 
creating global admins, creating accounts / passwords is simple

```
$ docker exec mdc-api-1 python -mmdc_api.cli reset-pw --username foobar --password bar
```

## Giving a user global admin

```
$ docker exec mdc-api-1 python -m mdc_api.cli list-users
1: admin
6: foo
7: foobar

$ docker exec mdc-api-1 python -m mdc_api.cli grant-admin --uid 6
```

## Giving user admin rights for 1 squadron/wing

This can be done multiple times for multiple wings

* Create the squadron in the UI as an admin

```
$ docker exec mdc-api-1 python -m mdc_api.cli list-squadrons
1: None
3: somethign

$ docker exec mdc-api-1 python -m mdc_api.cli list-users
1: admin
6: foo
7: foobar

$ docker exec mdc-api-1 python -m mdc_api.cli grant-squadron --uid 6 --sid 3
```
