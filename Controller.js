import { Console } from 'console';
import Node from './Graph_Node.js'

class Controller {
	constructor(count,height,width) {
		this.node_count = count;
		this.height = height;
		this.width = width;
		this.collections = [];
		this.winning_nodes=[];//save of winners in last games
		this.losing_nodes=[];//save of the worst fit nodes
		this.stats=[];//array of 'stats' object - data from the games
		this.best_fitness = 0;
		this.stop=false;
        this.max_render_count = 10000;
		this.epoc_level=2000;
        this.catch_range = 100;
		this.max_range = 200;
		this.render_count = 0;
		this.game_count = 0;
		this.brain_template = null;
        this.init_collection();
		this.run.bind(this);
		}
	init_collection() {
		for (let i = 0; i < this.node_count; i++) {
			this.add_node()
		}
	}
	set_catch(num) {
		this.catch_range = num;
	}
	set_max_connection_length(num) {
		this.max_range = num;
	}
	step(living_nodes) {
		this.update_collections(living_nodes);
	}
	update_collections(livingNodes) {
		livingNodes.forEach(node => node.update(livingNodes, this.width, this.height, this.catch_range, this.max_range))
		this.handle_eat(livingNodes);
		livingNodes.forEach(node => !node.is_activated ? node.deactivate() : null)
	}
	reward_triangles(triangles) {
		triangles.forEach(triangle => {
			let reward_type =  150
            if(triangle.every((node,i,arr)=>node.type==arr[(i+1)%arr.length==0]).type) 50
            if(triangle.every((node,i,arr)=>node.type!=arr[(i+1)%arr.length==0]).type) 250
			const area = this.triangle_area(triangle);
			const reward =Math.floor(Math.sqrt((area)/reward_type))
			triangle.forEach(node => node.update_fitness(reward))
        })
	}
	handle_eat(living_nodes) {
		living_nodes.forEach(node => {
			node.connections.forEach(other_node => {
				const eater = node.r >= other_node.r ? node : other_node;
				const eatee = node.r < other_node.r ? node : other_node;
				const distance = eater.get_distance_between_edges(eatee);
				if (distance <= 0 && this.get_living_nodes().length > 0) {
					if (eater.type == eatee.type) {
						eater.change_type();
						eater.update_fitness(-Math.floor(eatee.fitness));
						eatee.set_is_activated(false);
					} else {
						eatee.change_type();
						eatee.impulse_away_from(eater);
                        eatee.fitness=1;
					}
				}
			})
		})
	}
	get_all_triangles(living_nodes) {
		const triangle = (n1, n2, n3) => ([n1, n2, n3])
		const contains_triangle = (arr, trig) => arr.find(x => x.includes(trig[0]) && x.includes(trig[1]) && x.includes(trig[2]))
		const triangles = [];
		const possible_triangle_nodes = [];
		const visted_nodes = [];
		living_nodes.forEach(node_l1 => {
			node_l1.connections.forEach(node_l2 => {
				node_l2.connections.forEach(node_l3 => {
					const is_triangle = node_l3.connections.includes(node_l1);
					if (is_triangle && (!visted_nodes.includes(node_l1) || !visted_nodes.includes(node_l2))) {
						const t = triangle(node_l1, node_l2, node_l3);
						if (!contains_triangle(triangles, t)) {
							triangles.push(t);
							visted_nodes.push(t[0]);
							visted_nodes.push(t[1]);
							visted_nodes.push(t[2]);
						}
					}
				})
			})
		})
		return triangles;
	}
	triangle_area(triangle){
		const width = triangle[0].get_distance_from_center(triangle[1]);
		const half_point = width/2;
		const angle = triangle[0].get_angle(triangle[1])
		const x_transpose=Math.cos(triangle[0].x+angle*half_point)
		const y_transpose=Math.sin(triangle[0].y+angle*half_point)
		const center_width={x:x_transpose,y:y_transpose}
		const height= triangle[2].get_distance_from_center(center_width)
		return width*height/2
	}
	add_node() {
		const randx = Math.floor(Math.random() * this.width);
		const randy = Math.floor(Math.random() * this.height);
		const randt = Math.random() > 0.3 ? "A" : Math.random() > 0.3 ? "B" : "C";
		this.collections.push(new Node(randx, randy, randt, this));
	}
	get_fitest_val() {
		return Math.max.apply(Math, this.collections.map((o) => o.fitness))
	}
	get_fitest_node() {
		return this.get_living_nodes().find(x => x.fitness >= this.get_fitest_val())
	}
    get_living_nodes(){
		//debug
		//return this.collections
        return this.collections.filter(x=>x.is_activated)
    }
	render() {
        const living_nodes = this.get_living_nodes();
        const triangles = this.get_all_triangles(living_nodes);
		this.reward_triangles(triangles)
		this.step(living_nodes);

		this.render_count++;
		
	}
	engine(that){
		setInterval(()=>{
			console.time("runtime")
			that.run(that);
			console.timeEnd("runtime")
			
			console.log("rendercount:",that.render_count,that.get_living_nodes().length,"living nodes total")
			const fitest_node = that.get_fitest_node();
			console.log('fittest node:',fitest_node.id," fitness",fitest_node.fitness, "pos: ",fitest_node.x.toFixed(0),fitest_node.y.toFixed(0),"connections: length ",fitest_node.connections.length)

		},1)
		
	}
	timeTest(fn,args){
		console.time(`time of: ${fn.name}`);
		//take the function, arguments in order, run it - return a time
		if(Array.isArray(args)){
			fn(...args)
		}else{
			fn(args)
		}
		console.timeEnd(`time of: ${fn.name}`);

	}
	run(that) {
 		if (that.stop==true) return
		if (that.render_count > that.max_render_count) that.evaluate()
		else that.render();
	}
	clear_all_nodes() {
		this.collections = [];
	}
	new_game(winning_node) {
		this.render_count = 0;
		this.game_count++;
		const fitness_win = winning_node.fitness > this.best_fitness;
		this.best_fitness = this.best_fitness > winning_node.fitness ? this.best_fitness : winning_node.fitness;
		this.champion = fitness_win ? winning_node:this.champion;
		this.reactivate_nodes();
        this.scatter_nodes();
		this.set_next_brains(this.champion);
        this.mutate_nodes(winning_node.fitness,this.best_fitness);
        this.reset_nodes_fitness();
	}
	set_next_brains(winning_node,p,g){
		this.collections.forEach(node=>node.Brain.set_next_brain(winning_node.Brain,p,g))
	}
    reset_nodes_fitness(){
        this.collections.forEach(node=>node.fitness=1)
    }
    reactivate_nodes(){
        this.collections.forEach(node=>node.set_is_activated(true));
    }
    scatter_nodes(){
        this.collections.forEach(node=>node.scatter())
    }
    mutate_nodes(winner,champion){

        this.collections.forEach(node=>node.mutate_next(node.fitness/winner.fitness,winner/champion.fitness));
    }
	evaluate() {
		console.log("\n\nwinner winner chicken dinner\n\n")
		console.log("fitest node is:");
		const fitest = this.get_fitest_node();
		fitest.win_count++;
		console.log(fitest.id);
		console.log(fitest.fitness, "vs champion of:", this.best_fitness)
		console.log("this was the fitest node: ",fitest.win_count)
		console.log("\n\n")
		if (!fitest) {
		} else {
			if(this.game_count==this.epoc_level){
				console.log(fitest.fitness,"last call");
				return
			}
			this.new_game(fitest);
		}
	}

	full_json_data(){
		const game_stats = this.get_game_stats();		
		const nodes = this.collections.map(x=>x.no_function_copy());
		return {game_stats,nodes}	
	
	}
	get_game_stats(){
		return {todo:"this is a todo"}
	}

}

export default Controller