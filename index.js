import express from 'express'
import {Server} from 'socket.io'
import http from 'http'
import Controller from './Components/Controller.js'
import cors from 'cors'
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});







const game = new Controller(600,1920,1080);

const port =3000;

   
app.use(express.static('public'))

app.get("/", function(req,res){
console.log("hello!")
})

io.on('connection', (socket) => {  
  console.log('a user connected')
  
  game.set_socket(socket)

  socket.on("disconnect", () => {
    console.log("unsetting socket");
    game.unset_socket();
  })
  ;});
server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
game.engine(game);

