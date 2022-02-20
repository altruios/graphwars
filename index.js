import express from 'express'
import {Server} from 'socket.io'
import http from 'http'
import Controller from './Components/Neat_controller.js'
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






const game_options={
  node_count: 250,
	height: 1080*2,
	width:1920*2,
  render_speed:31,
  max_render_count: 1,
	epoc_level:910000,
  notice_range:150,
	visual_range: 300,
  target_species:5,
}
const game = new Controller(game_options);

const port =3001;

   
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

