function* ID(){
 let id=0n;
 while(true){
     yield id++
 }   
}
export default ID