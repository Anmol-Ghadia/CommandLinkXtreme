"# Command Link Xtreme"
An app that allows two users to communicate securely with end-to-end encryption. The chats are not retained anywhere making the communication more secure.

A user can create a new chat session by creating a session on the website and sending an invite link to the other user using email.

A user can bypass the email communication and join the session using session-id

## Pages
1) Landing page (index)
    contains site name and option to start chatting
1) Create new session page (create)
    enter alias and the other user's email
1) Join session page (join)
    enter alias and join button
1) Chat page (chat)
    the user can communicate here and end session any user

## Links
1) index
    1) create
    1) join
1) create
    1) chat (redirected when new session)
    1) index (Go back button)
1) join
    1) chat (redirected when valid id)
    1) index (Go back button)
1) chat
    1) index (End session button)

## Features to work on in the future
1) Timeout for session as selected by user
1) Multiple users
1) File transfer


## Todo
1) create index page in pug
1) create index page in express
1) create create page in pug
1) create create page in express
1) create join page in pug
1) create join page in express
1) create chat page in pug
1) create chat page in express
1) add banner on chat page if invalid session
1) add javascript to chat page which does the following things:
    1) checks if user has valid session id
    1) sets up an websocket with the server
    1) waits for a user to connect
    1) once connected, exchange keys for encryption
    1) now the user can chat
    1) all chats should be encrypted before sending
1) Add database with SQLlite or oracle sql
1) 

### Developer Instructions

1) To instal `node_modules`
    ```BASH
    npm install
    ```
1) For compiling TypeScript files
    ```BASH
    npx tsc -w
    ```
    > Note: Leave this terminal window open
1) To run the server
    ```BASH
    node ./dist/main.js
    ```
### Notes
1) WebSockets on browser [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
1) WebSockets [npm WS](https://www.npmjs.com/package/ws)
1) End to end encryption [link](https://www.codementor.io/@behnamanjomruz/creating-end-to-end-encryption-using-private-and-public-key-in-javascript-22ac0ohx4h)
1) [NodeMailer](https://www.w3schools.com/nodejs/nodejs_email.asp)
