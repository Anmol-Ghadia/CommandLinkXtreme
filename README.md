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
        key: "this client's public key here",
        alias: 'chosen alias of this client'
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
        command: 'A-LV',
        alias: 'alias of the leaving user, for confirmation'
    }
    ```
    for acknowledging leaving of a user
    ```js
    message = {
        command: 'A-JN',
        alias: 'alias of the joining user, for confirmation'
    }
    ```
    for acknowledging joining of user

    This is important to this client as it will have to either save the public key of new user or remove the information related to old user.
1) `M4` : this transition goes from `S5` to `S3`
    
    this is similar to `M3` but it only occurs if the number of total clients goes to 1(which is this client itself). Since no one else is present in the session, `S3` is the appropriate state until someone joins.
    The message sent from this client to server should be of the following format
    ```js
    message = {
        command: 'A-AL'
    }
    ```
    This command is short for Acknowledge-Alone. the alias of the user that just left is implied to be correct as both the server and client can confirm that `A-Al` command was triggered due to that client leaving. 

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
        message: 'descrption of reason for not being able to join'
    }
    ```
    the command is short for failed-join. This is a special kind of error, but it is not considered as misbehaving by the client

1) `R3` : this transition goes from `S2` to `S4`

    this is a similar transition as `R1` but in this case, users are already present in the session
    ```js
    message = {
        command: 'E-JN',
        payload: [
            {
                alias: 'alias of other client 1',
                key: 'public key of client 1'
            },
            {
                alias: 'alias of other client 2',
                key: 'public key of client 2'
            }
            :
            :
            .
        ]
    }
    ```
    the command is short for established-join

1) `R4` : goes from `S3` to `S4`

    this message is received from the server when the client is waiting for another user to join and a user finally joins
    ```js
    message = {
        command: 'JOIN'
        alias: 'alias of the client new client',
        key: 'public key of the new client'
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
        alias: 'alias here'
    }
    ```

### Special commands
1) exit command may be sent by this user in any state to close the connection properly.
    ```js
    message = {
        command: 'EXIT'
    }
    ```
1) Error, this is sent by the server whenever it detects that a user is misbehaving and not following the protocol. The error should also contain a message about the issue in `plain-text`
    ```js
    message = {
        command: 'ERRO',
        message: 'description of error'
    }
    ```

### Example State changes
This section is intended to give some examples of how different clients might navigate different states as there are changes in a session. And hopefully give a better understanding of the protocol

#### Scenario 1
In this scenario, two clients want to communicate with each other. and finally close the communication

Here, `S` is short for Server, `SX` where X is a number is a state with number X. `C1` is client 1 and `C2` is client 2


| Sr. No. |            description             | Client 1(C1) | client 2(C2) |
|---------|------------------------------------|--------------|--------------|
|       1 | C1 est. WS conn. with S            | S1           | -            |
|       2 | C1 sends M1: 'JOIN'                | S2           | -            |
|       3 | S creates a session                | S2           | -            |
|       4 | S sends R1: 'A-JN' to C1           | S3           | -            |
|       5 | S,C1 wait for C2 to join           | -            | -            |
|       6 | C2 est. WS Conn. with S            | -            | S1           |
|       7 | C2 sends M1: 'JOIN'                | -            | S2           |
|       8 | S sends R3: 'E-JN' to C2           | -            | S4           |
|       9 | S sends R4: 'JOIN' to C1           | S4           | -            |
|      10 | M2,R5: 'MESG' sent to other client | -            | -            |
|      11 | C2 sends 'EXIT'                    | -            | EXIT state   |
|      12 | S sends R6: 'LEAV' to C1           | S5           | -            |
|      13 | C1 sends M4: 'A-AL' to S           | S3           | -            |
|      14 | C1 may wait or leave now           | -            | -            |
|      15 | C1 sends 'EXIT'                    | EXIT State   | -            | 

> `Note:` dashes in states imply that there is no state change.

#### Scenario 2
In this scenario, three clients want to communicate with each other. and finally close the communication

Many states were explicitly stated in `Scenario 1`, but in practice they would be assumed and will execute instantly. hence, they are omitted here to keep things concise


| Sr. No. |           Description           |  C1  |  C2  |  C3  |
|---------|---------------------------------|------|------|------|
|       1 | C1 sends M1 to S                | S2   | -    | -    |
|       2 | S sends R1 to C1                | S3   | -    | -    |
|       3 | until a client joins            | -    | -    | -    |
|       4 | C3 joins with M1                | -    | -    | S2   |
|       5 | S sends R3 to C3                | -    | -    | S4   |
|       6 | S sends R4 to C1                | S4   | -    | -    |
|       7 | M2's are sent as R5 to other C  | S4   | -    | S4   |
|       8 | C2 joins with M1                |  -   | S2   | -    |
|       9 | S sends R6 to C1                | S5   | -    | -    |
|      10 | S sends R6 to C3                | -    | -    | S5   |
|      11 | C1 sends M3 to S                | S4   | -    | -    |
|      12 | C3 sends M3 to S                | -    | -    | S4   |
|      13 | S sends R3 to C2                | -    | S4   | S4   |
|      14 | M2's are sent as R5 to other Cs | -    | -    | -    |
|      15 | C3 sends 'EXIT' to S            | -    | -    | EXIT |
|      16 | S sends R6 to C1                | S5   | -    | -    |
|      17 | S sends R6 to C2                | -    | S5   | -    |
|      18 | C1 sends M3 to S                | S4   | -    | -    |
|      19 | C2 sends M3 to S                | -    | S4   | -    |
|      20 | M2's are sent as R5 to other C  | -    | -    | -    |
|      21 | C1 sends 'EXIT' to S            | EXIT | -    | -    |
|      22 | S sends R6 to C2                | -    | S5   | -    |
|      23 | C2 sends M4 to S                | -    | S3   | -    |
|      24 | C2 sends 'EXIT' to S            | -    | Exit | -    |

### State diagram with Commands
HERE !!!

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
