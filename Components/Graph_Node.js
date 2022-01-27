import Brain from './Brain.js'
import {do_to_co} from '../utilities/do_to_co.js';
class Graph_Node {
	constructor(x, y, type, ref,id) {
		if (x == NaN) {
			console.log("x is wrong");
		}
		this.x = x;
		this.y = y;
		this.ref = ref;
		this.id = "node-"+id
		this.r = Math.floor(Math.max(5, Math.random() * 20));
		this.type = type;
		this.connections = [];
		this._deletable = false;
        this.is_activated=true;
		this.Brain = new Brain(this, null);
		this.Brain.connect_host(this);
		this.fitness = 1;
        this.last_performance = 0;
        this.win_count=0;
	}
    no_function_copy(){
        return {
			id:this.id,
			win:this.win_count,
			x:this.x, 
			y:this.y,
			r:this.r,
			type:this.type,
			connections:this.connections.map(x=>({x:x.x,y:x.y,connections:x.connections.map(y=>({x:y.x,y:y.y,connections:y.connections.map(z=>({x:z.x,y:z.y}))}))})),
			is_activated:this.is_activated,  
			fitness:this.fitness,
			last_p:this.last_performance*100,
			last_x:this.Brain.last_move_vec[0]/this.Brain.last_move_vec[1]||0,
			last_y:this.Brain.last_move_vec[2]/this.Brain.last_move_vec[3]||0,
			mutation_value:this.Brain.mutation_value(),
			scream:this.Brain.get_scream(),
		}
    }
    scatter(){
        this.connections.forEach(other_node=>this.disconnect(other_node))
        const randx= this.ref.width*Math.random()
        const randy= this.ref.height*Math.random()
        this.x=randx;
        this.y=randy;
    }
    mutate_next(p,g){
        this.last_performance=p;
        this.Brain.mutate_next(p,g);
        
    
    }
    set_brain(brain){
        this.Brain=brain?brain.next_generation_mutate() : new Brain(this,null)
    }
	update_fitness(amount) {
		this.fitness += amount;
		this.fitness = Math.max(this.fitness, 0)
	}
	get_distance_from_center(other_node) {
		const dx = (other_node.x - this.x);
		const dy = (other_node.y - this.y);
		const df = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
		return df
	}
	change_type() {
		this.type = this.type == "A" ? "B" : this.type == "B" ? "C" : "A";
	}
	clear_adjacent(node) {
		this.connections = this.connections.filter(x => x != node);
	}
	get_distance_between_edges(other_node) {
		const dx = (other_node.x - this.x);
		const dy = (other_node.y - this.y);
		const df = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
		const rt = this.r + other_node.r;
		return df - rt;
	}
	impulse_away_from(other_node) {
		const angle = this.get_angle(other_node);
		this.x -= Math.cos(angle) * other_node.r;
		this.y -= Math.sin(angle) * other_node.r;
	}
	move(all_bubbles) {
		const result = this.Brain.run(all_bubbles);
		this.x += result[0] / result[1] || 0;
		this.y += result[2] / result[3] || 0;
		if (!this.y || !this.x) {
			console.log(result, "is result from failed brain");
			console.log(this.x, this.y, "are not numbers?", " brain below");
			console.log(this.Brain);
			console.error("brain malfunction");
		}
	}
	update_r() {
		const fitness_range = do_to_co(this.fitness,[1,30000],[1,10])
		const update_r = this.connections.length
		this.r = fitness_range * (update_r);
        this.r=Math.max(5,this.r);
	}
	update_color() {
		this.color = this.connections.length == 0 ? "#aaaaaa" : this.type == "A" ? `#ff0000` : this.type == "B" ? "#00ff00" : "#0000ff"
	}
	boundries(width, height) {
		this.x = Math.min(Math.max(this.x, 0), width);
		this.y = Math.min(Math.max(this.y, 0), height);
	}
	connect(other_node) {
		if (!this.connections.includes(other_node)) {
			this.connections.push(other_node);
		}
		if (!other_node.connections.includes(this)) {
			other_node.connections.push(this);
		}
	}
	make_connections(all_nodes, node_catch_range) {
		
		const not_connected_yet = all_nodes.filter(x => this.connections.every(y => y.id != x.id) && x.id != this.id);
		const close_enough = not_connected_yet.filter(other_node => this.get_distance_from_center(other_node) < node_catch_range ? true : false)
		close_enough.forEach(n => this.connect(n));
	}
	break_connections(node_max_range) {
		this.connections.forEach(other_node => {
			if (this.get_distance_from_center(other_node) > node_max_range) {
				this.disconnect(other_node);
			}
		})
	}
	disconnect(other_node) {
		other_node.connections = other_node.connections.filter(x => x != this);
		this.connections = this.connections.filter(x => x != other_node);
	}
	update(width, height, cr, mr) {
        const close_nodes = this.ref.quadTree.find(this);    

		this.make_connections(close_nodes, cr);
		//console.time("update_cell");
        this.move(close_nodes);

		//console.timeEnd("update_cell");

        this.break_connections(mr);
        this.update_r();
        this.update_color();
        this.boundries(width, height);

    }
    deactivate(){
        this.connections.forEach(other_node=>this.disconnect(other_node));
    }
    set_is_activated(bool){
		if(!bool){
			this.fitness=0.1
		}
        this.is_activated=bool;
    }
	isLargest() {
		const is_largest = this.connections.every(x => x.r < this.r)
		return is_largest ? 255 : 100;
	}
	isSmallest() {
		const is_smallest = this.connections.every(x => x.r > this.r)
		return is_smallest ? 255 : 100;
	}
	has_friends() {
		const has_friends = this.connections.length > 1;
		return has_friends ? 255 : 100;
	}
	get_angle(other_node) {
		const dx = other_node.x - this.x;
		const dy = other_node.y - this.y;
		const angle = Math.atan(dy, dx);
		return angle;
	}
	scream(){
		return this.Brain.get_scream();
	}
	reward(){
		this.win_count++;
	}
}
export default Graph_Node