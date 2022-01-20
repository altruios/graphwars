import express from 'express'
import Controller from './Controller.js'
const game = new Controller(420,4700,3080);



const port =3000;
const app = express();


   
app.use(express.static('public'))

app.get("/", function(req,res){

})
app.get("/get_current_data",function(req,res){
    res.send(game.full_json_data())
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
game.engine(game);

