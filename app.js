let express=require('express');
let http = require('http');
let cors = require('cors');

let runSockets = require('./socket');

const app = express();
const server = http.createServer(app);

server.listen(3000, () => {
  console.log('server is running ......');
});

app.use(cors());
app.get("/public/bundle.js",(req,res)=> {
  res.sendFile(__dirname + "/public/bundle.js")});
app.get("/public/style.css",(req,res)=> {
  res.sendFile(__dirname + "/public/style.css")});
app.use("/",(req,res)=> {
  res.sendFile(__dirname + '/index.html')});
runSockets(server);
