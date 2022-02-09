import ID from './ID.js'
console.log(ID)
const cellID = ID();

class Cell {
	constructor(height, brain,j) {
		this.connections_forward = [];
		this.connections_backwards = [];
		this.weights = [];
		this.activation_value = Math.cos(Math.random() - 1 * 2);
		this.bias = Math.sin(Math.random() - 1 * 2);
		this.height = null;
		this.row_index = j;
		this.mutation = 0.1;
		this.id = "cell-"+cellID.next().value;
		this.is_answer_row = height==brain.height;
		this.Brain = brain;
		this.mutation_counter = 0;
		this.height = height;
	}
	no_function_copy(){
		return {
			id:this.id.toString(),
			connections_forward:this.connections_forward.map(x=>x.id.toString()),
			connections_backwards:this.connections_backwards.map(x=>x.id.toString()),
			weights:this.weights.map(x=>x),
			activation_value:this.activation_value,
			bias:this.bias,
			mutation:this.mutation,
			is_answer_row:this.is_answer_row, 
			mutation_counter:this.mutation_counter,
			height:this.height
		}
	}
	get_weights() {
		return this.weights;
	}
	setActivation_Value() {
		const new_activation = this.get_next_activation_value();
		this.activation_value = new_activation;
	}
	get_next_activation_value() {
		const ax = this.connections_backwards.reduce((acc, x, i) =>acc+=this.weights[i] * x.activation_value, 0)
		const new_activation = Math.tanh(ax + this.bias);
		return new_activation
	}
	propagate_change_forward() {
		this.setActivation_Value();
		for (let i = 0; i < this.connections_forward.length; i++) {
			this.connections_forward[i].propagate_change_forward()
		}
	}
	setMutation(value) {
		this.mutation = value;
		this.mutation = Math.min(1, (Math.max(-1, this.mutation)))
	}
	_copy(cell) {

		if (cell == undefined) {
			return;
		}
		this.weights = cell.weights.map(x =>x)
		this.activation_value = cell.activation_value
		this.bias = cell.bias;

	}
	_child(cell,oCell){ // i of collection is chosen
		const doner_bool = cell.Brain.host.fitness>oCell.Brain.host.fitness?1:0;
		const main_doner = doner_bool?cell:oCell; //fiter cell is main doner
		const secondary_doner = doner_bool?oCell:cell;
		this.bias = (main_doner.bias*2+secondary_doner.bias)/3 //bias is weighted average of main doner
		this.weights=this.weights.map((x,i)=>i%2==0?(secondary_doner.weights[i]):main_doner.weights[i])
	}
	between_neg1_and_1(value){
		return Math.min(1,Math.max(-1,value))
	}
	mutation_advance() {
		this.mutation = this.between_neg1_and_1(this.mutation + this.mutation/100)
	}
	mutation_reduce() {
		this.mutation = this.between_neg1_and_1(this.mutation - this.mutation/100)

	}
	clear_all_connections() {
		this.connections_backwards = [];
		this.connections_forward = [];
	}
	init_weights(other_cells) {
		other_cells.forEach((other_cell, i) => this.weights[i] = (Math.sin(other_cell.activation_value * this.activation_value)));
	};
	connect(other_cell) {
		this.connections_forward.push(other_cell)
		other_cell.connections_backwards.push(this)
	}
    mutate_next(p,g){
        this.mutate_bias(p,g)
        this.mutate_weights(p,g);
        Math.sin(this.mutation_counter*this.mutation)>0?this.mutation_advance():this.mutation_reduce();
    }
    mutate_bias(p,g){
        if(g>Math.random()){
            this.bias=this._mutate(this.bias,p)
		}
    }

    mutate_weights(p,g){

        this.weights=this.weights.map(weight=>(g>Math.random())?this._mutate(weight,p):weight)
    }
    _mutate(val,p){
		this.mutation_counter++;
		const sign =Math.random()>0.5?1:-1; 
		return Math.max(Math.min(this.mutation*p+sign*val,1),-1)

    }
}

export default Cell