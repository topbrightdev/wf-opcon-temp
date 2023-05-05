### What dis?
---
Bingo Opcon is a front-end application for game show host to control bingo and other mini games

## Setup / Installation
---
* In terminal / cmd, `cd` to the project folder
* Run `npm install`
* Run `npm run build`

## Dev Config Options

If you want to use stg-auth keycloak instead of Docker Stack keycloak, you need these:
```
"authServiceUrl": "https://stg-auth.timeplay.com/auth/realms/Users/protocol/openid-connect/token",
"logoutUrl": "https://stg-auth.timeplay.com/auth/realms/Users/protocol/openid-connect/logout",
"clientId": "tp-admin",
```

Set this to true for OpCon debug menu to navigate to any view you want without needing GameServer:
```
"opconDebug": true,
```

Set this to a really high value if you want RMB client to not timeout if it can't connect:
```
"rmbMaxConnectionAttempts": 10000
```
