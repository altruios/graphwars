import Cell from './Cell.js'
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
        template ? this.copy_from(template):this.init_weights();        
	}
    no_function_copy(){
        return{
            generation_number:this.generation_number,
            matrix:this.matrix.map(x=>x.no_function_copy()),
            mutation_counter:this.mutation_counter,
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
	copy_from(template,p,g) {
		this.matrix.forEach((cell, i, arr) => {
			cell._copy(template.find_equivelent_cell(cell, arr.filter(x => x.height == cell.height).indexOf(cell)),p,g)
		});
	}
    set_next_brain(template,p,g){
        this.copy_from(template,p,g);
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
	copy(template) {
        console.log(template, "is there!")
		const copy = new Brain(this.host, template);
		copy.generation_number = this.host.ref.game_count;
		return copy
	}
	get_last_fitness() {
		return this.last_fitness;
	}
	set_last_fitness() {
		this.last_fitness = this.host.fitness;
	}
	mutate(activation) {
		// console.log("mutating brain");
		this.matrix.forEach(cell => cell.mutate(activation))
		this.mutation_counter++;
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

        data.push(this.Map_R_Real(this.host.r,[1,100]));
		data.push(this.Map_R_Pos(this.host.fitness,[1,6000]))
        data.push(this.Trool(this.host.type))// type troolian
        
        const add_all_other_nodes_data=(data,c)=>{

            let ref=other_nodes.sort((a,b)=>this.host.get_distance_between_edges(a)>this.host.get_distance_between_edges(b));
            ref=ref.filter((x,i)=>i<8);
            if(ref!=undefined&&ref!=null&&Array.isArray(ref)&&ref.length>0){
            ref.forEach(node=>{
                data.push(this.Map_R_Real(this.host.get_distance_between_edges(node),[0,500]));
                data.push(this.host.get_angle(node));
                data.push(this.Map_R_Real(node.fitness,[0,10000]))
                data.push(this.Map_R_Real(node.connections.length,[0,30]));
                data.push((node.is_activated==true?1:-1));
                data.push(this.Map_R_Real(node.r,[1,50]));
                data.push(this.Trool(node.type))
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

		const result = this.get_output();
		return result;
	}
	prop_forward() {
		const to_propagate = this.matrix.filter(x => x.height != 0);
		//all but begining row
		for (let i = 0; i < to_propagate.length; i++) {
		//	console.assert(!isNaN(to_propagate[i].activation_value), "cell corrupted")
			to_propagate[i].setActivation_Value();
			//console.assert(!isNaN(to_propagate[i].activation_value), "cell get_next_activation_value failing")
		}
	}
	set_inputs(input_data) {
		const input_row = this.get_input_cells();
		for (let i = 0; i < input_data.length; i++) {
			input_row[i].activation_value = input_data[i];
		}
	}

    Map_R_Pos(val,o_r){
        return this.Map_Range(val,o_r,[0,1])
    }
    Map_R_Real(val,o_r){
        return this.Map_Range(val,o_r,[-1,1])
    }
    Map_Range(val,o_r,n_r){
        return (val - o_r[0]) * (n_r[1] - n_r[0]) / (o_r[1] - o_r[0]) + n_r[0]
    }
    Trool(type){
        return type=="A"?-1:type=="B"?0:1
    }
}
export default Brain