import __INNOVATION_TABLE from './_INNOVATION_TABLE.js';
import ID from './ID.js'
console.log(ID)
const cellID = ID();
import {do_to_co,do_to_real,do_to_pos} from '../utilities/do_to_co.js';
class Neat_Brain{
	constructor(host, template,template2) {
		this.generation_number = 0;
		this.cells = []
		this.connections=[]
        this.host = host;
        this.scream=0;
		this.last_move_vec = [0, 0, 0, 0];
		this.last_fitness = this.host.fitness;
        this.fitness=1;
        this.species=0;//iffy
        this.vision_number=4;
        this.depth=24
        this.host_id=host.id;
		if(!template){
            this.init_cells();
            this.init_connections();     
        }else{
            this.generation_number = 1+template.generation_number;
            this.child(template,template2);

        }
	}

    all_hidden_cells_connected(){
        const active_hidden = this.get_hidden_cells();
        const active_connections = this.get_active_connections();
        for(let i=0;i<active_hidden.length;i++){
            const found__backward_connections = active_connections.filter(x=>x.n1.id==active_hidden[i].id)
            const found__forward_connections = active_connections.filter(x=>x.n2.id==active_hidden[i].id)
            if(found__backward_connections.length==0){
                const reactivation_selections = this.connections.filter(x=>x.n1.id==active_hidden[i].id);
                const index = Math.floor(reactivation_selections.length*Math.random())
                if(reactivation_selections.length==0){
                    active_hidden[i].deactivate()
                    const all_connected = this.connections.filter(x=>x.has(active_hidden[i]))
                    all_connected.forEach(c=>c.disable());
                }else{
                    reactivation_selections[index].enable()

                }
            }else if(found__forward_connections.length==0){
                const reactivation_selections = this.connections.filter(x=>x.n2.id==active_hidden[i].id);
                const index = Math.floor(reactivation_selections.length*Math.random())
                if(reactivation_selections.length==0){
                    active_hidden[i].deactivate()
                    const all_connected = this.connections.filter(x=>x.has(active_hidden[i]))
                    all_connected.forEach(c=>c.disable());
                }else{               
                     reactivation_selections[index].enable()
                }
            }
        }
    }
    i_am_sane(){
        const active_hidden = this.get_hidden_cells();
        const input_layer = this.get_input_cells();
        const output_layer=this.get_output_cells();
        const active_connections = this.get_active_connections();
        const first_connections = active_connections.filter(x=>x.n1.is_input_layer);
        const last_connections = active_connections.filter(x=>x.n1.is_answer_layer);
        const mid_connections = active_connections.filter(x=>x.n1.is_hidden_layer);
        
        let sanity_check = true;
        const connection_checker_backward =(connection,active_connections,sanity_check)=>{
            if(connection.n1.is_input_layer){sanity_check}
            else{
                let backward_connections = active_connections.filter(x=>x.n2.id==connection.n1.id &&x.n2.is_active);
                for(let i=0;i<backward_connections.length;i++){
                    sanity_check=connection_checker_backward(backward_connections[i],active_connections,sanity_check);
                }
            }
            return false;
        }
        const connection_checker_forward =(connection,active_connections,sanity_check)=>{
            if(connection.n2.is_answer_layer){sanity_check}
            else{
                let forward_connections = active_connections.filter(x=>x.n1.id==connection.n2.id&&x.n1.is_active);
                for(let i=0;i<forward_connections.length;i++){
                    sanity_check=connection_checker_forward(forward_connections[i],active_connections,sanity_check);
                }
            }
            return false;
        }
        for(let i=0;i<first_connections.length;i++){
                connection_checker_forward(first_connections[i],active_connections,sanity_check)
            }
        for(let i=0;i<last_connections.length;i++){
            connection_checker_backward(last_connections[i],active_connections,sanity_check)
        }

        for(let i=0;i<mid_connections.length;i++){
            connection_checker_forward(mid_connections[i],active_connections,sanity_check)
            connection_checker_backward(mid_connections[i],active_connections,sanity_check)
        }

        if(!sanity_check){
            console.log(input_layer.length,output_layer.length,active_hidden.length)
            console.log(input_layer.length+output_layer.length+active_hidden.length,this.cells.length);
            console.log(this.connections.length,active_connections.length);
            console.log(this.connections.filter(x=>!active_connections.some(y=>y.in_id==x.in_id)).map(x=>`${x.n1.id}=>${x.n2.id}`));
            console.log("data");
            throw Error;
        }
        return sanity_check


    }
    deactivate_vestigial_cells(){
        this.cells.forEach(x=>this.get_active_connections().every(c=>c.n1.id!=x.id&&c.n2.id!=x.id)?x.deactivate():x.activate())
    }
    deactivate_vestigial_weights(){
        this.connections.forEach(x=>this.get_active_cells().some(cell=>x.n1.id==cell.id||x.n2.id==cell.id)?null:x.disable())
    }
    get_active_cells(){
        return this.cells.filter(x=>x.is_active);
    }
    get_active_connections(){
        return this.connections.filter(x=>x.is_active);
    }
    copy_data(){
        let obj={
            generation_number : this.generation_number,
    		cells :this.cells.map(x=>x.copy_data()),
    		connections:this.connections.map(x=>x.copy_data()),
            scream:this.scream,
            last_move_vec:this.last_move_vec,
            last_fitness: this.last_fitness,
            species:this.species,
            host_id:this.host_id,

        }
        return obj
    }
    child(brain_1,brain_2){
        //find dominate parentcells
        const brain_1_is_fitest=brain_1.fitness>=brain_2.fitness?true:false;
        const [parent_1,parent_2] = brain_1_is_fitest?[brain_1,brain_2]:[brain_2,brain_1];
    
        //structure definition
        const input_layer = parent_1.get_input_cells();
        const output_layer = parent_1.get_output_cells();
        const parent_1_hidden_layer = parent_1.get_all_hidden_cells();
        const parent_2_hidden_layer = parent_2.get_all_hidden_cells();
        
        const hidden_layer = [];
        parent_1_hidden_layer.forEach(cell=>hidden_layer.push(cell));
        parent_2_hidden_layer.forEach(cell=>{
            if(!hidden_layer.some(x=>x.id==cell.id)){
                cell.deactivate();
                hidden_layer.push(cell)}
        });

        const new_cells = [...input_layer,...hidden_layer,...output_layer];
        new_cells.forEach(cell=>{
            const target = this.cells.find(c=>c.id==cell.id);
            if(!target){
                this.cells.push(new Neat_Cell(cell.layer_number,this,cell.layer_index,cell.is_input_layer,cell.is_answer_layer,cell.is_active))
            }else{
                target.child(cell);
            }
        })
        //value bias definition
        this.cells.forEach(cell=>{
            const parent1_gene =parent_1.cells.find(x=>x.layer_number==cell.layer_number&&x.layer_index==cell.layer_index)?.bias 
            const parent2_gene =parent_2.cells.find(x=>x.layer_number==cell.layer_number&&x.layer_index==cell.layer_index)?.bias 
            cell.bias = parent2_gene?Math.random()>.5?parent2_gene:parent1_gene:parent1_gene;
            if(!cell.bias) cell.bias=Math.random()*2-1
        })


        const new_conns_all = [...parent_2.connections,...parent_1.connections.filter(x=>!parent_2.connections.some(y=>y.is(x)))];
        new_conns_all.forEach(conn=>(!parent_2.connections.some(x=>x.is(conn))?conn.disable():null))

        new_conns_all.forEach(conn=>{
            const found = this.connections.find(x=>x.is(conn))
            if(!found) this.connections.push(new Connection(conn.n1,conn.n2,conn.weight));
            else found.child(conn);
        })
        this.connections.forEach(conn=>{
            const parent2_phene = parent_1.connections.find(c=>c.is(conn))?.weight;
            if(parent2_phene){
                if(Math.random()>.5){
                    conn.set_w(parent2_phene)
                }
            }  
        })
        this.deactivate_vestigial_cells();
        this.deactivate_vestigial_weights();
        this.all_hidden_cells_connected();
    }
    sort_cells(){
        //sort by matrix to arr math?
        // layer_number
        this.cells.sort((a,b)=>a.layer_number-b.layer_number||a.layer_index-b.layer_index);
    }
    mutate_next(v,g){
        this.manage_mutate(v,g)
    }
    manage_mutate(value,gaurd){
        this.add_or_delete_weight(value,gaurd);
        this.randomize_weight(value,gaurd);
        this.mutate_weight(value,gaurd);
        this.add_or_delete_cell(value,gaurd);
        this.update_bias(value,gaurd);
        this.sort_cells();

        this.all_hidden_cells_connected();

        this.i_am_sane();
    }
    add_or_delete_weight(value,guard){
        if(Math.random()*.6<guard){
           // console.log(value,guard,"changed structure - should be rare");
            if(Math.random()>.02){
                this.add_weight()
            }else{
                this.delete_weight()
            }
        }
    }
    add_weight(){
        const ac = this.get_active_connections();
        const found = ac.filter(x=>x.is_active==false)[Math.floor(ac.length-1*Math.random())]
        if(!found){
            const acells=this.get_active_cells();
            const t1= acells[Math.floor(acells.length*Math.random())]
            const uniquecells = acells.filter(x=>x.id!==t1.id);
            const t2= uniquecells[Math.floor(uniquecells.length*Math.random())]
            const things=[t1,t2].sort((a,b)=>a.layer_number-b.layer_number);
            if(things[0].layer_number==this.depth||things[1].layer_number==0){return}
            const c = new Connection(t1,t2);
            if(this.connections.some(x=>x.in_id==c.in_id)){return}
            this.connections.push(c);
        }else{
            found.enable();
        }
    }
    delete_weight(){
        const found = this.get_active_connections();
        const potential = found.filter((x,i,arr)=>(
            x.n1.id==arr.find(y=>y.in_id!=x.in_id&&(y.n1.id==x.n1.id||y.n1.id==x.n2.id)))
            &&
            x.n2.id==arr.find(y=>(y.in_id!=x.in_id&&(y.n2.id==x.n1.id||y.n2.id==x.n2.id)))
            )
        const target = potential[Math.floor(Math.random()*potential.length-1)]
        if(target)target.disable();
    }

    sanity_check(added_node){
        if( added_node.layer_number!=0&&
            added_node.layer_number!=this.depth)
            return true
    }
    randomize_weight(value,guard){
        if(Math.random()>value){
            const ac = this.get_active_connections();
            ac.forEach(c=>Math.random<guard?c.weight=Math.random()-1*2:null)        }
    }
    mutate_weight(value,guard){
        if(Math.random()>guard){
            const ac= this.get_active_connections();
            const i = Math.floor(do_to_co(value,[-1,1],[0,ac.length-1]))

            const target_con = ac[i]
            try{
            target_con.mutate(value,guard);
            }catch{
                console.error(target_con,value,ac.length,"could not mutate?");
            }
        } 
    }
    add_or_delete_cell(value,guard)
        {
            //debug
        if(Math.random()>0.987937){
       //     console.log(value,guard,"changed cell structure - should be rare");

            if(Math.random()>.8456456){
                const found = this.cells.filter(x=>!x.is_active)
                if(found.length>0){
                    console.log("reactivating cell");
                    const target = found[Math.floor(found.length*Math.random())];
                    let attached_weights = this.connections.filter(c=>c.is_active&&(c.n1.id==target.id||c.n2.id==target.id))
                    const w1 = attached_weights.filter(c=>c.n1.is_active==true&&c.n2.id==target.id);
                    const W1=w1[Math.floor(w1.length*Math.random())]
                    attached_weights=attached_weights.filter(x=>x.id!=w1.id)
                    const w2 = attached_weights.filter(c=>c.n1.is_active==true&&c.n2.id==target.id);
                    const W2=w2[Math.floor(w2.length*Math.random())]

                    try{
                    W1.enable();
                    W2.enable();
                    target.enable();
                    }catch{

                    W1?.disable();
                    W2?.disable();
                    target?.deactivate();
                    }
                }else{
                    console.log("adding brand new cell");
                    this.add_cell()
                }
            }else{
                const targets = this.get_hidden_cells();
                const target = targets[Math.floor(Math.random()*targets.length)];
                if(target){
                    this.remove_cell(target) 
                }
            }
        }
    }
    update_bias(wf,bf){
        const g = Math.abs(Math.sin(this.last_fitness / bf));
        const v = Math.sin(this.last_fitness / wf);
        if(Math.random()>g)this.cells.forEach(c=>c.mutate_bias(v,g));
    }

    calc_input_row_count(){
        return this.vision_number*6+8 //vision closest, 8 props of each. and 8 props of self
    }
	init_cells() {
		this.cells = [];
		const answer_layer = 5; // x/ y/ ...controls=>{bool:bitmap_value_change_map}
		const input_layer_length = this.calc_input_row_count();//
        for (let i = 0; i < 2; i++) {
			const layer_breadth = i ==0?input_layer_length:answer_layer;
			for (let j = 0; j < layer_breadth; j++) {
				const cell = new Neat_Cell(i==0?0:this.depth, this, j,i==0,layer_breadth==answer_layer,true); //x y info, on graph.
				this.cells.push(cell);
			}
		}
	}
    init_connections(){
        const input_layer=this.get_input_cells()
        const output_layer=this.get_output_cells();
        input_layer.forEach(c=>output_layer.forEach((oc)=>{
            const weight = Math.random()*2-1;
            this.connections.push(new Connection(c,oc,weight))
        }))
    }
	get_output_activation_value() {
		return this.get_output_cells().map(x => x.activation_value);
	}
	get_hidden_cells() {
		return this.cells.filter(x => x.is_hidden_layer&&x.is_active);

	}
    get_all_hidden_cells(){
        return this.cells.filter(x => x.is_hidden_layer);

    }
	get_output_cells() {
		return this.cells.filter(x => x.is_answer_layer);
	}
	get_input_cells() {
		return this.cells.filter(x => x.is_input_layer);
	}
	get_scream(){
		return this.scream
	}
	get_last_fitness() {
		return this.last_fitness;
	}

	connect_host(host) {
		this.host = host;
	}
    add_cell(){
        console.log("adding node-braincell");
        const hidden_count = this.get_hidden_cells().length;
        let chosen_connections = this.get_active_connections();
        chosen_connections = hidden_count>6?Math.random()>.5?
            chosen_connections.filter(x=>x.n1.is_hidden_layer):
            chosen_connections.filter(x=>x.n2.is_hidden_layer):
            chosen_connections;
        const random_chosen_connection = chosen_connections[Math.floor(Math.random()*chosen_connections.length)];
        if(!random_chosen_connection){
            console.log("active connections selection failed - ",chosen_connections.length);
            return
        }
        const n1=random_chosen_connection.n1;
        const n2=random_chosen_connection.n2;
       
        const [b,s]=n1.layer_number>n2.layer_number?[n1.layer_number,n2.layer_number]:[n2.layer_number,n1.layer_number]
        const node_layer = Math.floor(b-((b-s)/2))
        const node_layer_index = this.get_hidden_cells().filter(x=>x.layer_number==node_layer).length;   
        const cell = new Neat_Cell(node_layer,this,node_layer_index,false,false,true);
        if(this.sanity_check(cell)){
            console.log("sanity check passed");
            this.cells.push(cell)
            this.connections.push(new Connection(n1,cell))
            this.connections.push(new Connection(cell,n2))
            random_chosen_connection.disable();
        }else{
            console.log("failed sanity",cell.layer_number);
        } 
    }
	remove_cell(target) {
        console.log('diabling cell');
		const found = this.get_hidden_cells().find(x=>x==target);//sanity checks
        if(!found) return
        found.deactivate()
        this.remove_connections(found);
        //more clean up here
    }
    remove_connections(found_cell){
        this.connections.forEach(conn=>conn.has(found_cell)?conn.disable():null)
    }
	run(other_nodes) {
        const data = this.get_data(other_nodes);
        const prediction = this.predict(data);
        this.last_move_vec = this.get_move_vector(prediction);
        this.set_scream(prediction[4])
        return this.last_move_vec;
    }
 
    set_scream(val){
        this.scream = val;
    }
	get_move_vector(prediction) {
		return [prediction[0], prediction[1], prediction[2], prediction[3]]
	}
	get_data(other_nodes) {
		//okay ==so data is going to come in an array
		const data = [];
		data.push(this.last_move_vec[0])
		data.push(this.last_move_vec[1])
		data.push(this.last_move_vec[2])
		data.push(this.last_move_vec[3])
		//details
        data.push(do_to_real(this.host.r,[1,50]));
        const tf = this.host.ref.best_fitness==1?this.fitness:this.host.ref.best_fitness;
		data.push(do_to_real(this.fitness,[1,tf]))
        data.push(do_to_real(this.x, [0,this.host.ref.width]))
        data.push(do_to_real(this.y, [0,this.host.ref.height]))
        const add_all_other_nodes_data=(data,c)=>{
            let ref=other_nodes.sort((a,b)=>this.host.get_distance_between_edges(a)-this.host.get_distance_between_edges(b));
            ref=ref.filter((x,i)=>i<this.vision_number);
            if(ref!=undefined&&ref!=null&&Array.isArray(ref)&&ref.length>0){
				ref.forEach(node=>{
                    //(this.x- node.x)(this.y-node.y)
                    data.push(do_to_real((this.x-node.x),[-this.host.ref.width,this.host.ref.width]))
                    data.push(do_to_real((this.y-node.y),[-this.host.ref.height,this.host.ref.height]))
			        const top_fitness=node.ref.best_fitness==1?node.Brain.fitness:node.ref.best_fitness;
					data.push(do_to_real(node.Brain.fitness,[0,top_fitness]))
					data.push(do_to_real(node.r,[1,50]));
					data.push(Trool(this.type,node.type))
					data.push(node.Brain.scream)
				})

				for(let i=0;i< this.vision_number-ref.length;i++){
					data.push(0);
				}

            }else{
                for(let i=0;i<c;i++){
                    for(let j=0;j<6;j++){
						console.log('pushing blank data')
                        data.push(0);
                    }
                }
            }
        }
        add_all_other_nodes_data(data,this.host.ref.cell_count);
      	const clean_data = data.map(x => isNaN(x) ? 0 : !isFinite(x) ? x > 0 ? 1 : -1 : x);
		clean_data.length < data.length ? console.error("got infitiy or nan getting in") : null;
		return clean_data;
	}
	predict(data) {
        this.set_inputs(data);
		this.prop_forward();
		return this.get_output_activation_value();
	}
	prop_forward() {
		const to_propagate = this.get_active_cells().filter(x => !x.is_input_layer);
		const rows =[];
         to_propagate.forEach(item=>{
            if(!rows[item.layer_number]) rows[item.layer_number]=[];
            rows[item.layer_number].push(item);
        },[])
        const to_prop_rows=rows.filter(x=>x);
        to_prop_rows.forEach(row=>row.forEach(cell=>cell.setActivation_Value()))
        
	}
	set_inputs(input_data) {
		const input_row = this.get_input_cells();
		for (let i = 0; i < input_data.length; i++) {
			input_row[i].activation_value = input_data[i];
		}
	}
}
class Neat_Cell{
    constructor(layer_number, brain,j,is_input_layer,is_answer_layer,is_active) {
        this.Brain = brain;
		this.activation_value = 0;
		this.bias = (Math.random() - 1 * 2);
		this.mutation = 0.1;
		this.id = `cell-${layer_number}-${j}`;
		this.is_answer_layer = is_answer_layer
        this.is_input_layer = is_input_layer;
        this.is_hidden_layer = !is_answer_layer&&!is_input_layer
		this.mutation_counter = 0;
		this.layer_number=layer_number;
        this.layer_index = j;
        this.is_active=is_active!=undefined?is_active:true;
    }
    copy_data(){
        const obj= {
		activation_value:this.activation_value ,
		bias:this.bias ,
		mutation:this.mutation ,
		id:this.id,
		is_answer_layer:this.is_answer_layer ,
        is_input_layer:this.is_input_layer,
        is_active:this.is_active,
        is_hidden_layer:this.is_hidden_layer,
		mutation_counter:this.mutation_counter,
		layer_number:this.layer_number,
        layer_index:this.layer_index,
        }
        return obj;
    }

    child(template){
        
        this.Brain=template.Brain;
        this.activation_value=template.activation_value;
        this.bias=Number(template.bias)||Math.random();
        this.id=template.id;
        this.is_answer_layer=template.is_answer_layer;
        this.is_hidden_layer=template.is_hidden_layer;
        this.is_input_layer=template.is_input_layer;
        this.layer_number=template.layer_number;
        this.layer_index=template.layer_index;
        this.is_active=template.is_active;
        this.mutation = template.mutation;
        this.mutation_counter = template.mutation_counter;

    }	

	setActivation_Value() {
		this.activation_value = this.get_next_activation_value();
	}
	get_next_activation_value() {
        const connections = this.Brain.get_active_connections().filter(x=>x.n2.id==this.id);

		const ax = connections.reduce((acc, c, i) =>acc+= c.weight * c.other_node(this).activation_value, 0)
		const new_activation = Math.tanh(ax + this.bias);
		return new_activation
	}
    enable(){
        this.activate();
    }
    disable(){
        console.log("disabling",this.id,"CELL!!!!\n\n\n");
        this.deactivate();
    }
    activate(){
        this.is_active=true;
    }
    deactivate(){
        this.is_active=false;
    }
    mutate_bias(v,g){
        if(Math.random()>g){
            this.bias=this._mutate(this.bias,v)
		}
        console.assert(this.bias!=null,"this.id:",this.id,"bias is null?");
    }
    _mutate(val,p){
		this.mutation_counter++;
		const sign =Math.random()>0.5?1:-1; 
		return Math.max(Math.min(this.mutation*p+sign*val,1),-1)
    }

}
class Connection{
    constructor(n1,n2,w){
        const [a,b]=n1.layer_number>n2.layer_number?[n1,n2]:n1.layer_number==n2.layer_number?n1.layer_index>n2.layer_index?[n1,n2]:[n2,n1]:[n2,n1];

        this.n1=b;
        this.n2=a;
        this.weight=w||Math.random()*2-1;
        this.is_active=true;
        this.mutation_counter=0;
        this.in_id=this.get_in_id();
    
    }
    child(template){
        this.n1=template.n1;
        this.n2=template.n2;
        this.weight=template.weight;
        this.is_active=template.is_active;
        this.mutation_counter=template.mutation_counter;
        this.in_id=template.in_id;
    }
    mutate(p,g){
        if(Math.random()<g){
            this.weight=this._mutate(this.weight,p);
        }
    }
    copy_data(){
        return{
            n1:this.n1.id,
            n2:this.n2.id,
            weight:this.weight,
            is_active:this.is_active,
            mutation_counter:this.mutation_counter,
            in_id:this.in_id,
        }
    }
    is(conn){
        return conn.in_id==this.in_id;
    }
    get_in_id(){
        return __INNOVATION_TABLE(this.n1,this.n2)
    }
    set_w(w){
        this.weight=w;
    }
    enable(){
        this.is_active=true;
    }
    disable(){
        this.is_active=false;
    }
    other_node(node){
        if(this.is_active==false)return -1
        return this.n1==node?this.n2:this.n1;
    }
    has(n){
        return this.n1.id==n.id||this.n2.id==n.id;
    }
    _mutate(val,p){
		this.mutation_counter++;
		const sign =Math.random()>0.5?1:-1; 
		return Math.max(Math.min(p+sign*val,1),-1)
    }
}
const Trool = (t,b)=>t==b?1:-1;
export default Neat_Brain