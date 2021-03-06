# All Bad Cards

#### License
AGPL 3.0

#### Credits ####
Thanks to https://github.com/greencoast-studios/cards-against-humanity-api for much of the card data.

# Usage 

### Requirements

- NodeJS
- Redis 
- MongoDB
- Yarn (classic) https://classic.yarnpkg.com/lang/en/

### Setup

- Create a file at `/config/keys.json`. This file must match the following schema:

```json
[
  {
    "mongo": {
      "local": "mongodb://your.url/letsplaywtf",
      "prod": "mongodb://your.url/letsplaywtf",
      "beta": "mongodb://your.url/letsplaywtf"
    },
    "redis": {
      "key": "",
      "port": 1234,
      "host": {
        "local": "localhost",
        "prod": "your.url",
        "beta": "your.url"
      }
    },
    "patreon": {
      "id": "_your_patreon_id_",
      "secret": "_your_patreon_secret_"
    },
    "crypto": {
      "key32": "_32_character_guid_",
      "iv16": "_16_character_guid_"
    },
    "userSecretSalt": "_some_salt_here_"
  }
]
```
Note: `letsplaywtf` was the name of the site before I changed it to All Bad Cards :P

In the above example, the `mongo` URLs are the connection strings to MongoDB in each given environment. Same with `redisHost` for Redis.

`redisKey` is the auth password for Redis. `redisPort` is the externally accessible port for Redis.

`userSecretSalt` is used to salt user cookies.


### Run & Build

- Local
    - From a command line, navigate to the root directory of the project.
    - Run the command `yarn dev`, which will simultaneously start up the client dev server and nodemon for the server
- Build
    - From a command line, navigate to the root directory of the project.
    - Run the command `yarn build` (or `yarn build-beta` for beta)
    - The output will be in the `/builds` folder, as a zip of the server and client.
- Hosted
    - Extract a built zip
    - From a command line, navigate to the extracted directory (the root of the build result)
    - Run the command `yarn start` or `npm run start`
