import Cell from './Cell.js'
import {do_to_real} from '../utilities/do_to_co.js';
class Brain {
	constructor(host, template) {
		this.generation_number = 0;
		this.matrix = []
		this.mutation_counter = 0;
		this.host = host;
        this.height=9;
		this.last_move_vec = [0, 0, 0, 0];
		this.last_fitness = this.host.fitness;
		this.init_matrix();
		this.connect_cells();
		this.scream=0;
		//console.log("\n\n\n\n\n\n\n",this.last_fitness,)
        this.init_weights();        
	}
    no_function_copy(){
        return{
            generation_number:this.generation_number,
            mutation_value:this.mutation_value(),
            height:this.height,
            last_move_vec:this.last_move_vec,
            last_fitness:this.last_fitness,     
        }
    }
    calc_input_row_count(){
        return 8*8+8 //8 closest, 8 props of each. and 8 props of self
    }
	init_matrix() {
		this.matrix = [];
		const height = this.height+1;
		const breadth = 13;
		const answer_layer = 5; // x/ y/ ...controls=>{bool:bitmap_value_change_map}
		const input_layer = this.calc_input_row_count();//
		for (let i = 0; i < height; i++) {
			const layer_breadth = !i == 0 ? i == height - 1 ? answer_layer : breadth : input_layer;
			for (let j = 0; j < layer_breadth; j++) {
				const cell = new Cell(i, this,j);
				this.matrix.push(cell);
			}
		}
	}
	become_child_of(brain,other_brain){
		this.matrix.forEach((cell,i)=>cell._child(brain.matrix[i],other_brain.matrix[i],i))
	}
	copy_from(template) {
		this.generation_number = this.host.ref.game_count;

		this.matrix.forEach((cell, i, arr) => {
			cell._copy(template.find_equivelent_cell(cell, arr.filter(x => x.height == cell.height).indexOf(cell)))
		});
	}
	connect_cells() {
		this.matrix.forEach((cell, i, arr) => arr.forEach((mcell, mi, marr) => cell.height + 1 == mcell.height ? cell.connect(mcell) : null))
	}
	init_weights() {
		this.matrix.forEach(cell => cell.connections_backwards.forEach(cb => cell.weights.push(Math.random() > 0.5 ? Math.random() * (-1) : Math.random())))
	} 
    mutate_next(p,g){
        this.matrix.forEach(cell=>cell.mutate_next(p,g))
	}
	get_output() {
		return this.get_output_cells().map(x => x.activation_value);
	}
	get_hidden_layers() {
		return this.matrix.filter(x => x.height != 0 && !x.is_answer_row)
	}
	get_output_cells() {
		return this.matrix.filter(x => x.is_answer_row);
	}
	get_input_cells() {
		return this.matrix.filter(x => x.height == 0);
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
	remove_cell(cell_index) {
		const cell = this.matrix.find(x => x.height == cell_index);
		this.matrix.forEach(c => c.connected_to(cell) ? c.disconnect(cell) : null)
	}
	find_equivelent_cell(cell, xpos) {
		const row = this.matrix.filter(x => x.height == cell.height);
		const get_row = (arr, cell) => arr.indexOf(cell)
		return row.find((c, i, arr) =>(get_row(arr, c) == Math.min(xpos, row.height))) || cell;
	}
	run(other_nodes) {
        const data = this.get_data(other_nodes);
        const last_prediction = this.get_output();
        const prediction = this.predict(data, last_prediction, this.host.fitness);
        this.last_move_vec = this.get_move_vector(prediction);
		this.set_last_fitness()
        this.set_scream(prediction[4])
		return this.last_move_vec
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
        data.push(do_to_real(this.host.r,[1,100]));
		data.push(do_to_real(this.host.fitness,[1,6000]))
        data.push(this.Trool(this.host.type))// type troolian
        data.push(this.scream)
        const add_all_other_nodes_data=(data,c)=>{
            let ref=other_nodes.sort((a,b)=>this.host.get_distance_between_edges(a)-this.host.get_distance_between_edges(b));
            ref=ref.filter((x,i)=>i<8);
            if(ref!=undefined&&ref!=null&&Array.isArray(ref)&&ref.length>0){
				ref.forEach(node=>{
					data.push(do_to_real(this.host.get_distance_between_edges(node),[0,500]));
					data.push(this.host.get_angle(node));
					data.push(do_to_real(node.fitness,[0,10000]))
					data.push(do_to_real(node.connections.length,[0,30]));
					data.push((node.is_activated==true?1:-1));
					data.push(do_to_real(node.r,[1,50]));
					data.push(this.Trool(node.type))
					data.push(node.scream())
				})
            }else{
                for(let i=0;i<c;i++){
                    for(let j=0;j<8;j++){
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
		return this.get_output();
	}
	prop_forward() {
		const to_propagate = this.matrix.filter(x => x.height != 0);
		//all but begining row
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
	mutation_value(){
		return this.matrix.reduce((acc,item)=>acc+item.mutation_counter,0)
	}
    Trool(type){
        return type=="A"?-1:type=="B"?0:1
    }
}
export default Brain