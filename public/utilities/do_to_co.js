//domain to codomain
// map a number from some range of numbers to another range of numbers

const do_to_co=(val,o_r,n_r)=>(val - o_r[0]) * (n_r[1] - n_r[0]) / (o_r[1] - o_r[0]) + n_r[0]
const do_to_pos=(val,o_r)=>do_to_co(val,o_r,[0,1]);
const do_to_real=(val,o_r)=>do_to_co(val,o_r,[-1,1]);

export default {do_to_co,do_to_pos,do_to_real}
export  {do_to_co as do_to_co, do_to_pos as do_to_pos, do_to_real as do_to_real}