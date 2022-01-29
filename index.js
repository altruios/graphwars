import express from 'express'
import bodyParser from 'body-parser';
import Controller from './Components/Controller.js'
const game = new Controller(500,2000,2000);



const port =3000;
const app = express();
app.use(bodyParser.json());

   
app.use(express.static('public'))

app.get("/", function(req,res){

})
app.post("/get_current_data",function(req,res){
    const id = req.body
    res.send(renderBucket.data)
})

let renderBucket = {
  data:null,
  set_data:(data)=>{
    renderBucket.data=data;
  }
};
renderBucket.set_data("2")
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
game.engine(game,renderBucket);

