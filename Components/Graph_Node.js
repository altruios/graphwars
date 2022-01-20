import Brain from './Brain.js'
import ID from './ID.js'
class Graph_Node {
	constructor(x, y, type, ref) {
		if (x == NaN) {
			console.log("x is wrong");
		}
		this.x = x;
		this.y = y;
		this.ref = ref;
		this.id = `id-${x}-${y}`;
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
			x:this.x, 
			y:this.y,
			id:this.id,
			r:this.r,
			type:this.type,
			connections:this.connections.map(x=>({x:x.x,y:x.y,connections:x.connections.map(y=>({x:y.x,y:y.y,connections:y.connections.map(z=>({x:z.x,y:z.y}))}))})),
			is_activated:this.is_activated=true,  
			fitness:this.fitness,
			last_performance:this.last_performance,
			last_move_vec_x:this.Brain.last_move_vec[0]/this.Brain.last_move_vec[1]||0,
			last_move_vec_y:this.Brain.last_move_vec[2]/this.Brain.last_move_vec[3]||0,

		}
    }
    scatter(){
        this.connections.forEach(other_node=>this.disconnect(other_node))
        const randx= this.ref.width*Math.random()
        const randy= this.ref.height*Math.random()
        this.x=randx;
        this.y=randy;
    }
    mutate_next(winner,champion){
        const performance = (this.fitness/champion); //how well did it do over all;
        this.last_performance=performance;

        const mutation_guard = (this.fitness/winner); //how well did it do in the game;
        this.Brain.mutate_next(performance,mutation_guard);
        
    
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
		console.assert(["A", "B", "C"].includes(this.type), "assert failed?")
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
		const move_vector = [0, 0];
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
		const fitness_range = MapRange(this.fitness,[1,30000],[1,10])
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
	update(all_nodes, width, height, cr, mr) {
            this.make_connections(all_nodes, cr);
            this.move(all_nodes);
            this.break_connections(mr);
            this.update_r();
            this.update_color();
            this.boundries(width, height);
        
    }
    deactivate(){
        this.connections.forEach(other_node=>this.disconnect(other_node));
    }
    set_is_activated(bool){
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
}

const MapRange=(val,o_r,n_r)=>(val - o_r[0]) * (n_r[1] - n_r[0]) / (o_r[1] - o_r[0]) + n_r[0]
const Map_R_Pos=(val,o_r)=>MapRange(val,o_r,[0,1]);
const Map_R_Real=(val,o_r)=>MapRange(val,o_r,[-1,1]);

export default Graph_Node