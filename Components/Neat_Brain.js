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
        this.species=0;//iffy
        this.vision_number=4;
        this.host_id=host.id;
		if(!template){
            this.init_cells();
            this.init_connections();     
        }else{
            this.generation_number = 1+template.generation_number;
            this.child(template,template2);
            this.deactivate_vestigial_cells();
            this.deactivate_vestigial_weights();
        }
	}
    deactivate_vestigial_cells(){
        this.cells.forEach(x=>this.get_active_connections().every(c=>c.n1.id!=x.id&&c.n2.id!=x.id)?x.deactivate():x.activate())
    }
    deactivate_vestigial_weights(){
        this.connections.forEach(x=>this.get_active_cells().some(cell=>x.n1.id==cell.id||x.n2.id==cell.id)?null:x.deactivate())
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
        this.cells = parent_1.cells.map(cell=>new Neat_Cell(cell.layer_number,this,cell.layer_index,cell.is_input_layer,cell.is_answer_layer, cell.id))
        const matching_conns = parent_1.connections.filter(x=>parent_2.connections.some(y=>y.in_id==x.in_id));
        
        this.connections = matching_conns.map(conn=>new Connection(conn.n1,conn.n2, conn.weight));

        //value bias definition
        this.cells.forEach(cell=>{
            const parent1_gene =parent_1.cells.find(x=>x.layer_number==cell.layer_number&&x.layer_index==cell.layer_index)?.bias 

            const parent2_gene =parent_2.cells.find(x=>x.layer_number==cell.layer_number&&x.layer_index==cell.layer_index)?.bias 
            cell.bias = parent2_gene?Math.random()>.5?parent2_gene:parent1_gene:parent1_gene;
        })
        this.connections.forEach(conn=>{
            const parent2_phene = parent_1.connections.find(c=>c.is(conn))?.weight;
            if(parent2_phene){
                if(Math.random()>.5){
                    conn.set_w(parent2_phene)
                }
            }
            
        })


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
    }
    add_or_delete_weight(value,guard){
        if(Math.random()*.6<guard){
           // console.log(value,guard,"changed structure - should be rare");
            if(Math.random()>.01){
                this.add_weight()
            }else{
                this.delete_weight()
            }
        }
    }
    add_weight(){
        const found = this.connections.filter(x=>x.is_activated==false)[Math.floor(this.connections.length-1*Math.random())]
        found?.enable();
        if(!found){
            const t1= this.cells[Math.floor(this.cells.length*Math.random())]
            const t2= this.cells[Math.floor(this.cells.length*Math.random())]
            const things=[t1,t2].sort((a,b)=>a.layer_number-b.layer_number);
            if(things[0].layer_number==12||things[1].layer_number==0){return}
            const c = new Connection(t1,t2);
            if(this.connections.some(x=>x.in_id==c.in_id)){
                return
            }
            this.connections.push(c);

        }
    }
    delete_weight(){
        console.count("deleteingweight")
        const found = this.connections.filter(x=>x.is_activated==true);
        const potential = found.filter((x,i,arr)=>(
            x.n1.id==arr.find(y=>y.in_id!=x.in_id&&(y.n1.id==x.n1.id||y.n1.id==x.n2.id)))
            &&
            x.n2.id==arr.find(y=>(y.in_id!=x.in_id&&(y.n2.id==x.n1.id||y.n2.id==x.n2.id)))
            )
        const target = potential[Math.floor(Math.random()*potential.length-1)]
        target?.disable();
    }

    sanity_check(added_node){
        if( added_node.layer_number!=0&&
            added_node.layer_number!=12) //more later
        return true
    }
    randomize_weight(value,guard){
        if(Math.random()<guard){
           // console.log("randomizeing weight",guard);

            this.connections[Math.floor(do_to_co(value,[-1,1],[0,this.connections.length-1]))].weight = Math.random()-1*2
        }
    }
    mutate_weight(value,guard){
        if(Math.random()>guard){
            //console.log("mutating weight",guard);
            const i = Math.floor(do_to_co(value,[-1,1],[0,this.connections.length-1]))
            const target_con = this.connections[i]
            target_con.mutate(value,guard);
        } 
    }
    add_or_delete_cell(value,guard)
        {
        if(Math.random()>guard*7){
       //     console.log(value,guard,"changed cell structure - should be rare");

            if(value>0){
                this.add_cell()
            }else{
                const targets = this.get_hidden_cells();
                const target = targets[Math.floor(Math.random()*targets.length)];
                this.remove_cell(target)
            }
        }
    }
    update_bias(wf,bf){
        const g = this.last_fitness / bf;
        const v = this.last_fitness / wf;
        if(Math.random()>g)this.cells.forEach(c=>Math.random()>g?c.mutate_bias(v,g):null);
    }

    calc_input_row_count(){
        return this.vision_number*8+8 //vision closest, 8 props of each. and 8 props of self
    }
	init_cells() {
		this.cells = [];
		const answer_layer = 5; // x/ y/ ...controls=>{bool:bitmap_value_change_map}
		const input_layer_length = this.calc_input_row_count();//
        for (let i = 0; i < 2; i++) {
			const layer_breadth = i ==0?input_layer_length:answer_layer;
			for (let j = 0; j < layer_breadth; j++) {
				const cell = new Neat_Cell(i==0?0:12, this, j,i==0,layer_breadth==answer_layer); //x y info, on graph.
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
		return this.cells.filter(x => !x.is_input_layer && !x.is_answer_layer)
	}
	get_output_cells() {
		return this.cells.filter(x => x.is_answer_layer);
	}
	get_input_cells() {
		return this.cells.filter(x => x.is_input_layer==true);
	}
	get_scream(){
		return this.scream
	}
	get_last_fitness() {
		return this.last_fitness;
	}
	set_last_fitness() {
		this.last_fitness = this.host.fitness;
	}
	connect_host(host) {
		this.host = host;
	}
    add_cell(){
      //  console.log("adding node-braincell");
        const random_chosen_connection = this.connections[Math.floor(Math.random()*this.connections.length)];
        const n1=random_chosen_connection.n1;
        const n2=random_chosen_connection.n2;
        const node_layer = Math.floor(
            Math.min(n1.layer_number,n2.layer_number)+
            Math.abs(n1.layer_number-n2.layer_number)/2);
        const node_layer_index = this.get_hidden_cells().filter(x=>x.layer_number==node_layer).length;   
        const cell = new Neat_Cell(node_layer,this,node_layer_index,false,false);
        if(this.sanity_check(cell)){
            this.cells.push(cell)
            this.connections.push(new Connection(random_chosen_connection.n1,cell))
            this.connections.push(new Connection(cell,random_chosen_connection.n2))
            random_chosen_connection.disable();
        }else{
            console.log("failed sanity",cell.layer_number);
        }
    }
	remove_cell(target) {
		const found = this.cells.find(x=>x==target);//sanity checks
        if(!found) return
        this.cells = this.cells.filter(x => x !== found);
        this.remove_connections(found);

        //more clean up here
    }
	run(other_nodes) {
        const data = this.get_data(other_nodes);
        const prediction = this.predict(data);
        this.last_move_vec = this.get_move_vector(prediction);
		this.set_last_fitness()
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
        data.push(do_to_pos(this.host.r,[1,100]));
		data.push(do_to_pos(this.host.fitness,[1,6000]))
        data.push(Trool(this.host.type))// type troolian
        data.push(this.get_scream())
        const add_all_other_nodes_data=(data,c)=>{
            let ref=other_nodes.sort((a,b)=>this.host.get_distance_between_edges(a)-this.host.get_distance_between_edges(b));
            ref=ref.filter((x,i)=>i<this.vision_number);
            if(ref!=undefined&&ref!=null&&Array.isArray(ref)&&ref.length>0){
				ref.forEach(node=>{
					data.push(do_to_pos(this.host.get_distance_between_edges(node),[0,500]));
					data.push(this.host.get_angle(node));
					data.push(do_to_pos(node.fitness,[0,10000]))
					data.push(do_to_pos(node.connections.length,[0,300]));
					data.push((node.is_activated==true?1:-1));
					data.push(do_to_pos(node.r,[1,50]));
					data.push(Trool(node.type))
					data.push(node.Brain.scream)
				})

				for(let i=0;i< this.vision_number-ref.length;i++){
					data.push(0);
				}

            }else{
                for(let i=0;i<c;i++){
                    for(let j=0;j<8;j++){
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
		for (let i = 0; i < to_propagate.length; i++) {
			to_propagate[i].setActivation_Value();
		}
	}
	set_inputs(input_data) {
		const input_row = this.get_input_cells();
		for (let i = 0; i < input_data.length; i++) {
			input_row[i].activation_value = input_data[i];
		}
	}
}
class Neat_Cell{
    constructor(layer_number, brain,j,is_input_layer,is_answer_layer) {
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
        this.is_active=true;
    }
    copy_data(){
        const obj= {
		activation_value:this.activation_value ,
		bias:this.bias ,
		mutation:this.mutation ,
		id:this.id,
		is_answer_layer:this.is_answer_layer ,
        is_input_layer:this.is_input_layer,
        is_hidden_layer:this.is_hidden_layer,
		mutation_counter:this.mutation_counter,
		layer_number:this.layer_number,
        layer_index:this.layer_index,
        }
        return obj;
    }	

	setActivation_Value() {
		this.activation_value = this.get_next_activation_value();
	}
	get_next_activation_value() {
        const connections = this.Brain.connections.filter(x=>x.n2.id==this.id);

		const ax = connections.reduce((acc, c, i) =>acc+= c.weight * c.other_node(this).activation_value, 0)
		const new_activation = Math.tanh(ax + this.bias);
		return new_activation
	}
	propagate_change_forward() {
		this.setActivation_Value();
		for (let i = 0; i < this.connections_forward.length; i++) {
			this.connections_forward[i].propagate_change_forward()
		}
	}
	clear_all_connections() {
		this.connections_backwards = [];
		this.connections_forward = [];
	}
    activate(){
        this.is_active=true;
    }
    deactivate(){
        this.is_active=false;
    }
    mutate_bias(p,g){
        if(g>Math.random()){
            this.bias=this._mutate(this.bias,p)
		}
    }
    _mutate(val,p){
		this.mutation_counter++;
		const sign =Math.random()>0.5?1:-1; 
		return Math.max(Math.min(this.mutation*p+sign*val,1),-1)
    }

}
class Connection{
    constructor(n1,n2,w){
        const [a,b]=n1.layer_number>n2.layer_number?[n1,n2]:[n2,n1];

        this.n1=n1;
        this.n2=n2;
        this.weight=w||Math.random()*2-1;
        this.is_active=true;
        this.mutation_counter=0;
        this.in_id=this.get_in_id();
    
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
    _mutate(val,p){
		this.mutation_counter++;
		const sign =Math.random()>0.5?1:-1; 
		return Math.max(Math.min(p+sign*val,1),-1)
    }
}
const Trool = (t)=>t=="A"?-1:t=="B"?0:1;
export default Neat_Brain