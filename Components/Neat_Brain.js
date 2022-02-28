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
		this.last_move_vec = [0, 0, 0, 0];
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
                    console.log("sanity check hit something that shouldn't exit -disabling hidden cell");
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
    check_connection(connection){
            return connection.is_valid()
    }
    check_cell(cell,ac){
        return cell.is_active&&ac.filter(x=>x.n1.id==cell.id||x.n2.id==cell.id).length>=2
    }
    i_am_sane(){
        const active_hidden = this.get_hidden_cells();
        const active_connections = this.get_active_connections();
        let sanity_check=true;
        active_hidden.forEach(cell=>{
            sanity_check=this.check_cell(cell,active_connections);
            if(!sanity_check){
           //     cell.disable();
                console.log("failed sanilty cell:",cell.id);
                sanity_check=true;
            }
        })
        active_connections.forEach(conn=>{
            sanity_check=this.check_connection(conn)
            if(!sanity_check){
                conn.should_be_valid();
                console.log("failed sanity check conn",sanity_check,conn.in_id);                
                sanity_check=true;
            }
        })
        

        


        return sanity_check


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
            last_move_vec:this.last_move_vec,
            fitness: this.fitness,
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
                const cell_template = cell.copy_data();
                cell_template.is_active=false;
                hidden_layer.push(cell_template)}
        });

        const new_cells = [...input_layer,...hidden_layer,...output_layer];
        new_cells.forEach(cell=>{
            const target = this.cells.find(c=>c.id==cell.id);
            if(!target){
                this.cells.push(new Neat_Cell(cell.layer_number,this,cell.layer_index,cell.is_input_layer,cell.is_answer_layer,true))
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



        const parent_2_conns = parent_2.connections;
        const parent_1_cons = parent_1.connections.filter(conn=>!parent_2.connections.some(c=>c.is(conn)))
        const new_conns = [...parent_2_conns,...parent_1_cons];
        new_conns.forEach(conn=>{
            const found = this.connections.find(x=>x.is(conn));
            if(found){
                found.child(conn);
            }else{
                this.connections.push(new Connection(conn.n1,conn.n2,conn.w))
            }
        })


        this.mutate_next()
        //this.all_hidden_cells_connected();
     //   this.i_am_sane();


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
            if(this.connections.some(x=>x.is(c))){return}
            this.connections.push(c);
        }else{
            found.enable();
        }
    }
    delete_weight(){
        const found = this.get_active_connections();
        const potential = found.filter((x,i,arr)=>(
            x.n1.id==arr.find(y=>!y.is(x)&&(y.n1.id==x.n1.id||y.n1.id==x.n2.id)))
            &&
            x.n2.id==arr.find(y=>(!y.is(x)&&(y.n2.id==x.n1.id||y.n2.id==x.n2.id)))
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
            ac.forEach(c=>Math.random<guard?c.randomize_weight():null)        }
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
    add_or_delete_cell()
        {
            //debug
       //     console.log(value,guard,"changed cell structure - should be rare");

            if(Math.random()>.9000056456){
                const found = this.cells.filter(x=>!x.is_active)
                if(found.length>0){
                    console.log("reactivating cell");
                    const target = found[Math.floor(found.length*Math.random())];
                    let attached_weights = this.get_active_connections().filter(c=>(c.n1.id==target.id||c.n2.id==target.id))
                    const w1 = attached_weights.filter(c=>c.n1.is_active==true&&c.n2.id==target.id);
                    let W1=w1[Math.floor(w1.length*Math.random())]
                    attached_weights=attached_weights.filter(x=>x.id!=w1.id)
                    const w2 = attached_weights.filter(c=>c.n1.is_active==true&&c.n2.id==target.id);
                    let W2=w2[Math.floor(w2.length*Math.random())]
                    if(!W1){
                        this.connections.push(new Connection(this.get_input_cells()[Math.floor(Math.random()*this.get_input_cells().length)],target,Math.random()*2-1))
                        W1=this.connections[this.connections.length-1];
                    }
                    if(!W2){
                        this.connections.push(new Connection(this.get_input_cells()[Math.floor(Math.random()*this.get_input_cells().length)],target,Math.random()*2-1))
                        W2=this.connections[this.connections.length-1];

                    }
                    
                }else{
                    console.log("adding brand new cell");
                    this.add_cell()
                }
            }else if(Math.random()>0.577937){
                const targets = this.get_hidden_cells();
                const target = targets[Math.floor(Math.random()*targets.length)];
                if(target){
                    this.remove_cell(target) 
                
            }
        }
    }
    update_bias(wf,bf){
        const g = Math.abs(Math.sin(this.fitness / bf));
        const v = Math.sin(this.fitness / wf);
        if(Math.random()>g)this.cells.forEach(c=>c.mutate_bias(v,g));
    }

    calc_input_row_count(){
        return this.vision_number*5+8 //vision closest, 8 props of each. and 8 props of self
    }
	init_cells() {
		this.cells = [];
		const answer_layer = 2; // x/ y/ ...controls=>{bool:bitmap_value_change_map}
		const input_layer_length = this.calc_input_row_count();//
        for (let i = 0; i < 2; i++) {
			const layer_breadth = i ==0?input_layer_length:answer_layer;
			for (let j = 0; j < layer_breadth; j++) {
				const cell = new Neat_Cell(i==0? 0:this.depth, 
                        this, 
                        j,
                        i==0,
                        layer_breadth==answer_layer,
                        true); //x y info, on graph.
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

	get_fitness() {
		return this.fitness;
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
        return this.last_move_vec;
    }
 

	get_move_vector(prediction) {
		return [prediction[0], prediction[1]]
	}
	get_data(other_nodes) {
		//okay ==so data is going to come in an array
		const data = [];
		data.push(this.last_move_vec[0])
		data.push(this.last_move_vec[1])
		data.push(do_to_real(this.x,[0,this.host.ref.width]))
		data.push(do_to_real(this.y,[0,this.host.ref.width]))
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
				})

				for(let i=0;i< this.vision_number-ref.length;i++){
					data.push(0);
				}

            }else{
                for(let i=0;i<c;i++){
                    for(let j=0;j<5;j++){
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
    is_valid(){
        return this.n1.is_active&&this.n2.is_active&&this.is_active;
    }
    should_be_valid(){
        this.is_active=this.n1.is_active&&this.n2.is_active; 
   }
    get_in_id(){
        return __INNOVATION_TABLE(this.n1,this.n2)
    }
    set_w(w){
        this.weight=w;
    }
    enable(){
        this.mutation_counter++;

        this.is_active=true;
    }
    disable(){
        this.mutation_counter++;

        this.is_active=false;
    }
    other_node(node){
        if(this.is_active==false)return -1
        return this.n1==node?this.n2:this.n1;
    }
    has(n){
        return this.n1.id==n.id||this.n2.id==n.id;
    }
    randomize_weight(){
        this.mutation_counter++;
        const sign =Math.random()>0.5?1:-1; 
        this.weight= Math.random()*sign;
    }
    _mutate(val,p){
		this.mutation_counter++;
		const sign =Math.random()>0.5?1:-1; 
		return Math.max(Math.min(p+sign*val,1),-1)
    }
}
const Trool = (t,b)=>t==b?1:-1;
export default Neat_Brain