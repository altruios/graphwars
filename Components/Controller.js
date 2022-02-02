import Node from './Graph_Node.js'
import ID from './ID.js'
import {do_to_co} from '../utilities/do_to_co.js';
import QuadTree from '../utilities/QuadTree.js'
const node_ID = ID();
class Controller {
	constructor(count,width,height) {
		this.node_count = count;
		this.height = height;
		this.width = width;
		this.last_game_data=null;
		this.collections = [];
		this.winning_nodes=[];//save of winners in last games
		this.losing_nodes=[];//save of the worst fit nodes
		this.stats=[];//array of 'stats' object - data from the games
		this.quadTree = new QuadTree(0,0,this.width,this.height)
		this.best_fitness = 1;
		this.stop=false;
        this.max_render_count = 5000;
		this.epoc_level=910000;
        this.catch_range = 100;
		this.render_speed=1;
		this.max_range = 200;
		this.best_living_count=0;
		this.render_count = 0;
		this.game_count = 0;
		this.brain_template = null;
		this.fitest_node=null;
		this.last_average_fitness=1;
		this.best_average_fitness=1;
        this.init_collection();
		this.run.bind(this);
		this.socket=null;
		}
		set_socket(socket){
			console.log("setting socket");
			this.socket=socket;
		}
		unset_socket(){
			this.socket=null;
		}
		emit(){
			if(this.socket==null) return
			const data = JSON.stringify(this.full_json_data())

			this.socket.emit("image",data)

			
		}
	init_collection() {
		for (let i = 0; i < this.node_count; i++) {
			this.add_node()
		}
		this.fitest_node=this.collections[0]
		this.champion=this.collections[0].no_function_copy();
	}
	set_catch(num) {
		this.catch_range = num;
	}
	set_max_connection_length(num) {
		this.max_range = num;
	}
	step(living_nodes) {
		this.update_quad_tree(living_nodes);


		this.update_collections(living_nodes);
		this.emit();
		
	}
	update_quad_tree(living_nodes){
		this.quadTree.reset_graph(living_nodes);
	}
	update_collections(livingNodes) {

		livingNodes.forEach(node => node.update(this.width, this.height, this.catch_range, this.max_range))


		this.handle_eat(livingNodes);
		livingNodes.forEach(node => !node.is_activated ? node.deactivate() : null)




	}
	reward_triangles(triangles) {
		triangles.forEach(triangle => {
			let reward_type =  250
            if(triangle.every((node,i,arr)=>node.type==arr[(i+1)%arr.length==0]).type) reward_type=100
            if(triangle.every((node,i,arr)=>node.type!=arr[(i+1)%arr.length==0]).type) reward_type=500
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
						eater.fitness=1//-=Math.abs(eater.fitness-eatee.fitness);
						eatee.fitness=1;
						eatee.set_is_activated(false);
					} else {
						eatee.change_type();
						eatee.impulse_away_from(eater);
                        eatee.fitness=1;
						eater.fitness=1;
					}
				}
			})
		})
	}
	get_all_triangles(living_nodes) {
		const triangle = (n1, n2, n3) => ([n1, n2, n3])
		const contains_triangle = (arr, trig) => arr.find(x => x.includes(trig[0]) && x.includes(trig[1]) && x.includes(trig[2]))
		const triangles = [];
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
		this.collections.push(new Node(randx, randy, randt, this, node_ID.next().value));
	}

	find_fitest_node(nodes){
		return nodes.sort((a,b)=>b.fitness-a.fitness)[0]

	}
    get_living_nodes(){
		//debug
		//return this.collections
        return this.collections.filter(x=>x.is_activated)
    }
	reward(living_nodes){
		living_nodes.forEach(node=>node.update_fitness(0.01));
		const triangles = this.get_all_triangles(living_nodes);
		this.reward_triangles(triangles)

	}
	render() {

        const living_nodes = this.get_living_nodes();
		this.reward(living_nodes);
			

		this.step(living_nodes);


		this.render_count++;
		
	} 
	engine(that){
		console.log("starting engine \n\n")
		setInterval(()=>{
			
			const startTime = Date.now();
			that.run(that);
			const time_end=pad(Date.now() - startTime,3," ")
			
			const fitest_node = that.find_fitest_node(that.get_living_nodes());
			const write_out={
				exists:false
			}
			write_out.exists=true;
			if(write_out.exists){

				process.stdout.moveCursor(-1000, -13)
				process.stdout.clearScreenDown()
				process.stdout.write(`
${pad("",100,"#")}
${pad("",100,"#")}
## render count:${pad("",8,"  ")}render time:${pad("",8,"  ")}count of nodes:${pad("",8,"  ")}game_count:${pad("",20," ")}##
##${pad(that.render_count,13," ")}${pad("",8," ")}${pad(time_end,10," ")}ms${pad("",9," ")}${pad(that.get_living_nodes().length,14," ")}${pad("",8,"  ")} ${pad(that.game_count.toString(),10," ")}${pad("",21," ")}##
##${pad("",96," ")}##
##  fitest node:${pad("",11," ")}position:${pad("",8," ")}${pad('fitness:',15,' ')}${pad("",4," ")}${pad("connections:",15," ")}${pad("",20," ")}## 
##${pad("",5," ")}${pad(fitest_node.id,8," ")}${pad("",5," ")}${pad(`x:${fitest_node.x.toFixed(0)} ,y:${fitest_node.y.toFixed(0)}`,15," ")}${pad("",11," ")}${pad(fitest_node.fitness.toFixed(1),12," ")}${pad("",5," ")}${pad(fitest_node.connections.length.toString(),14," ")}${pad("",21," ")}##
##${pad("",96," ")}##			
##      average:${pad("",7," ")}best average:${pad("",10," ")}last average:${pad("",5," ")}top survival#:${pad("",20," ")}##
##  ${pad(that.get_average_fitness().toFixed(2),11," ")}${pad("",8," ")}${pad(that.best_average_fitness.toFixed(2),12," ")}${pad("",15," ")}${pad(that.last_average_fitness.toFixed(2),8," ")}${pad("",16," ")}${pad(that.best_living_count,3," ")}${pad("",21," ")}##
##${pad("",96," ")}##
${pad("",100,"#")}
${pad("",100,"#")}`);	
					
			}
			

				
			},this.render_speed)
		
	}
	get_average_fitness(){
		const sum = this.collections.reduce((acc,item)=>{acc+=item.fitness;return acc},0)
		const total = this.collections.length;
		const average = sum/total;
		return average
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
		const fitness_win = winning_node.fitness >= this.best_fitness;
		const average_fitness = this.get_average_fitness();
		this.last_average_fitness=average_fitness;
		this.best_average_fitness=average_fitness>this.best_average_fitness?average_fitness:this.best_average_fitness;
		this.best_fitness = this.best_fitness > winning_node.fitness ? this.best_fitness : winning_node.fitness;
		this.champion = fitness_win ? winning_node.no_function_copy():this.champion;
		this.reactivate_nodes();
        this.scatter_nodes();
		
		this.set_next_brains(this.get_mating_pool(),winning_node);
        this.reset_nodes_fitness();
	}
	get_mating_pool(){
		const mating_pool=[];
		this.get_living_nodes().forEach(node=>{
			let mate_fitness = do_to_co(node.fitness,[1,this.champion.fitness],[0.001,1])
			const n = mate_fitness*100
			for(let i =0;i<n;i++){
				mating_pool.push(node);
			}
		})
		return mating_pool
	}
	set_next_brains(mating_pool,winning_node){
		this.collections.forEach(node=>{

			if(!(node.id==winning_node.id)){ // we skip the winning node - ensuring that it stays the same
				const p = node.fitness/this.best_fitness;
				const g = 0.01;//node.fitness/((this.best_fitness+winning_node.fitness)/2);
				if(mating_pool.length<=0){ //low survival rate - something weird - double g
					node.Brain.copy_from(this.champion.Brain)
					node.mutate_next(p,g*2)
				}else{
					const p1 = Math.floor(Math.random()*(mating_pool.length-1))
					let p2 = Math.floor(Math.random()*(mating_pool.length-1))
					while(p2==p1){
						p2=Math.floor(Math.random()*(mating_pool.length-1))
					}
					const parent_1 = mating_pool[p1];
					const parent_2 = mating_pool[p2];
					node.Brain.become_child_of(parent_1.Brain,parent_2.Brain);
					node.mutate_next(p,g)

			}
			}else{
				node.Brain.copy_from(this.champion.Brain);
			}
		})
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

	evaluate() {
		console.log("\n\nwinner winner chicken dinner\n\n")
		console.log("fitest node is:");
		const winners = this.get_living_nodes();
		this.best_living_count=winners.length>this.best_living_count?winners.length:this.best_living_count;
		const fitest = this.find_fitest_node(winners);
		fitest.reward();
		console.log(fitest.id);
		console.log(fitest.fitness.toFixed(1), "vs champion of:", this.best_fitness.toFixed(1))
		console.log("this was the fitest node: ",fitest.win_count)
		console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n")
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




		const nodes = this.collections.map(x=>x.shallow_copy());

		const triangles = this.get_all_triangles(this.get_living_nodes()).map(x=>x.map(y=>y.id));


	//	this.update_quad_tree(this.get_living_nodes())
	//	const quad_tree = this.quadTree.no_function_copy();
		return {game_stats,nodes,triangles}	
	}
	get_selected_node(selected_id){
		return this.collections.find(x=>x.id==selected_id)
	}
	get_node_info(selected_id){
		const node = this.get_selected_node(selected_id);
		return node.no_function_copy()
	}
	get_game_stats(){
		return {
			width:this.width,
			height:this.height,
			render_count:this.render_count,
			best_fitness:this.best_fitness,
			catch_range:this.catch_range,
			max_range:this.max_range,
			game_count:this.game_count,
			living_nodes:this.get_living_nodes().length,
			total_nodes:this.collections.length,
		}
	}

}
const pad = (val,pamount,what)=>{
	val=String(val)
	while(val.length<pamount){
		val=what+val
	}
	return val
}
export default Controller