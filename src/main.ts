import express, { Express, Request, Response } from "express";

const app: Express = express();
const port = process.env.PORT || 3000;

// Config
app.set('view engine','pug');

// Make static files public
app.use(express.static('public'))

// Route for home page
app.get("/", (req: Request, res: Response) => {
  res.render('index', {});
});

app.get("/join", (req: Request, res: Response) => {
  res.render('join', {});
});

app.get("/create", (req: Request, res: Response) => {
  res.render('create', {});
});

app.get("/chat", (req: Request, res: Response) => {
  res.render('chat',{});
});

// Start Process
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});



console.log("Websockets begin")
import { WebSocketServer } from 'ws';

// Store connections in a Map with custom IDs
let clients = new Map();
let nextClientId = 1;

const wss = new WebSocketServer({ port: 8080 });
console.log("WebSocket Server Live on ws://localhost:8080")

// wss.on('upgrade',(req,res,))

wss.on('connection', function connection(ws) {
  
  const clientId = nextClientId++;
  clients.set(clientId, ws);
  
  
  ws.on('error', console.error);

  ws.on('message', function messageIn(data) {
    console.log(`(${clientId}) sent: (${data})`);
  });

  ws.on('close', function close() {
    clients.delete(clientId);
    console.log(`(${clientId}) closed connection`)
  })
});

setInterval(()=>{
  console.log(`Current clients: ${clients.size}`);
},10*1000)
