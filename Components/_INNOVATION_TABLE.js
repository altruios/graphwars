const _INNOVATION_TABLE=Array(500).fill(Array(500).fill(0));
let _INNOVATION_COUNTER=1;

const __INNOVATION_TABLE=(n1,n2)=>{
    const input = n1.id.split("-")[1];
    const output= n2.id.split("-")[1];
    const row =_INNOVATION_TABLE[input]
    const found = row[output];
    if(found==0){
        const rval=_INNOVATION_COUNTER;
        _INNOVATION_TABLE[input][output] = _INNOVATION_COUNTER++;
        return rval;
    }
    return found;

}
/*

const __INNOVATION_TABLE = (n1,n2)=>{
    const found = _INNOVATION_TABLE.find(x=>x.n1==n1.id&&x.n2==n2.id||x.n1==n2.id&&x.n2==n1.id);
    if(found)return found.in_id;
    console.log("returning counter",_INNOVATION_COUNTER)
    _INNOVATION_TABLE.push({n1:n1.id,n2:n2.id,in_id:_INNOVATION_COUNTER})
    const rval = _INNOVATION_COUNTER;
    _INNOVATION_COUNTER++
    return rval;
}
*/
export default __INNOVATION_TABLE;