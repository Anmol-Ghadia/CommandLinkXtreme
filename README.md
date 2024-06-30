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

## Page and their function
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

## Client's communication protocol on web socket
### State Diagram
![IMG_0166](https://github.com/Anmol-Ghadia/CommandLinkXtreme/assets/47422194/362950c1-86ef-44b8-853f-b123d7c93fad)

### Key for diagram
1) All states are labeled with `S1`, `S2`, ....
1) All messages sent by this client are labeled `M1`, `M2`, ....
1) All messages received by this client are labeled with `R1`, `R2`, ....

### Meaning of states 
1) `S1`: Initial State
    
    When a client succesfully upgrades to a web socket, it is in this state

1) `S2`: Request sent
    
    Client has made a request to join a specific session, but yet to receive a response

1) `S3`: Waiting for other clients
    
    Client has been approved to join a session but no one else is in that session

1) `S4`: Completly Established
    
    Client is in an encrypted session with other users, regular communication may occur

1) `S5`: A client left/joined
    
    A new client either joined or old client left, interupting regular communication

### Meaning of state transitions
1) `M1`: this transition goes from `S1` to `S2`.
    
    it is sent by the client as soon as a websocket connection is established,
    It is in the following format
    ```js
    message = {
        command: 'JOIN',
        session: 'session Id',
        key: 'public key here',
        alias: 'chosen alias'
    }
    ```
1) `M(void)` : this transition goes from `S3` to `S3`.
    
    It means that any messages sent by the client in this state will be ignored by the server. (There is one exception! `EXIT` it is covered in detail below)
1) `M2` : this is a transition from `S4` to `S4`.
    
    This is going to be the most common message sent as it represents a regular message(encrypted), sent by this client to the server
    It is in the following format
    ```js
    message = {
        command: 'MESG',
        payload: [
            {
                alias: 'alias of the receiver',
                message: 'encrypted message here'
            },
            {
                alias: 'alias of the receiver',
                message: 'encrypted message here'
            },
            :
            :
            .
        ]
    }
    ```
    The payload will contain as many `alias-message` pairs as there are other clients in a session. Otherwise Error is signaled from the server
1) `M3` : this transition goes from `S5` to `S4`
    
    this signifies that this client has acknowledged the change in clients inside this session
    It is in the following format
    ```js
    message = {
        command: 'A-RM',
    }
    ```
    for acknowledging removal of user
    ```js
    message = {
        command: 'A-JN',
    }
    ```
    for acknowledging joining of user
    This is important to this client as it will have to either save the public key of new user or remove the information related to old user.
1) `M4` : this transition goes from `S5` to `S3`
    
    this is similar to `M3` but it only occurs if the number of total clients goes to 1(this is current client itself). Since no one else is present in the session `S3` is the appropriate state until someone joins.
    The message sent from this client to server should be of the following format
    ```js
    message = {
        command: 'A-AL'
    }
    ```
    This command is short for Acknowledge-Alone.

1) `R1` : this transition goes from `S2` to `S3`
    
    this signifies a state change due to `R`eceiveing a message from server stating that client has succesfully joined the requested session. But the client is alone in this session
    ```js
    message = {
        command: 'A-JN',
    }
    ```
    The command is short for Acknowledge-join.

1) `R2` : this transition goes from `S2` to `S1`

    this is received from the server when joining a session was not succesfull and is requested to try again.
    ```js
    message = {
        command: 'F-JN',
    }
    ```
    the command is short for failed-join

1) `R3` : this transition goes from `S2` to `S4`

    this is a similar transition as `R1` but in this case, users are already present in the session
    ```js
    message = {
        command: 'E-JN'
    }
    ```
    the command is short for established-join

1) `R4` : goes from `S3` to `S4`

    this message is received from the server when the client is waiting for another user to join and a user finally joins
    ```js
    message = {
        command: 'JOIN'
    }
    ```

1) `R5` : goes from `S4` to `S4`

    this message is sent by the server when a new message has been sent to it by another user. So, it is just forwarding it. This should be a very common transition. 
    ```js
    message = {
        command: 'MESG'
        from: 'alias here',
        message: 'encrypted message here'
    }
    ```
1) `R6` : goes from `S4` to `S5`

    this message is sent by the server when another user has interrupted a conversation by joining the session or leaving it.
    When a user joins:
    ```js
    message = {
        command: 'JOIN',
        alias: 'alias here',
        key: 'public key of the new user here'
    }
    ```
    when a user leaves:
    ```js
    message = {
        command: 'LEAV',
        alias: 'alias here',
        key: 'public key of the new user here'
    }
    ```

### Special case
exit command may be sent by this user in any state to close the connection properly.
```js
message = {
    command: 'EXIT'
}
```

## Features to work on in the future
1) Timeout for session as selected by user
1) Multiple users
1) File transfer


## Todo
1) create join page in pug
1) create join page in express
1) add banner on chat page if invalid session
1) add javascript to chat page which does the following things:
    1) checks if user has valid session id (front end only)
    1) ~~sets up an websocket with the server~~
    1) waits for a user to connect
    1) once connected, exchange keys for encryption
    1) now the user can chat
    1) all chats should be encrypted before sending
1) find a free sql server
1) ~~create chat page in pug~~
1) ~~create chat page in express~~
1) ~~create index page in pug~~
1) ~~create index page in express~~
1) ~~create create page in pug~~
1) ~~create create page in express~~
1) ~~nodemailer implementation~~
1) implement link generatoin for the chat for nodemailer

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
