const _INNOVATION_TABLE=[];
let _INNOVATION_COUNTER=0;
const __INNOVATION_TABLE = (n1,n2)=>{
    const found = _INNOVATION_TABLE.find(x=>x.n1==n1.id&&x.n2==n2.id||x.n1==n2.id&&x.n2==n1.id);
    if(found)return found.in_id;
    console.log("returning counter",_INNOVATION_COUNTER)
    _INNOVATION_TABLE.push({n1:n1.id,n2:n2.id,in_id:_INNOVATION_COUNTER++})
}
export default __INNOVATION_TABLE;