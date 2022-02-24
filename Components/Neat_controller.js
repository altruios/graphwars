import Node from './Graph_Node.js'
import ID from './ID.js'
import {do_to_co} from '../utilities/do_to_co.js';
import QuadTree from '../utilities/QuadTree.js'
const node_ID = ID();
class Neat_Controller{
	constructor(options) {
		this.node_count = options.node_count;
		this.height = options.height;
		this.width = options.width;
		this.target_species = options.target_species
		this.last_game_data=null;
		this.collections = [];
		this.winning_nodes=[];//save of winners in last games
		this.losing_nodes=[];//save of the worst fit nodes
		this.stats=[];//array of 'stats' object - data from the games
		this.quadTree = new QuadTree(0,0,this.width,this.height)
		this.best_fitness = 1;
		this.stop=false;
        this.render_speed=options.render_speed;
        this.max_render_count = options.max_render_count;
		this.epoc_level=options.epoc_level;
        this.notice_range = options.notice_range;
		this.visual_range = options.visual_range;
        this.species_threshold=4;
		this.best_living_count=0;
		this.render_count = 0;
		this.game_count = 1;
		this.brain_template = null;
		this.fitest_node=null;
		this.last_average_fitness=1;
		this.best_average_fitness=1;
        this.init_collection();
		this.run.bind(this);
		this.socket=null;
		this.examined_brain=null;
		this.set_examined_brain('node-0');
		}
		set_examined_brain(id){
			this.examined_brain=this.collections.find(x=>x.id==id)?.Brain||this.collections[0].Brain;
		}
		set_render_count(){
			this.game_count++;
			this.render_count = 0;
			this.max_render_count+=1;
			console.log("setting render",this.game_count);
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
		console.log("init collection")
		for (let i = 0; i < this.node_count; i++) {
			this.add_node()
		}
		this.fitest_node=this.collections[0].Brain;
		this.champion=this.collections[0].Brain;
	}
	set_catch(num) {this.catch_range = num;}
	set_max_connection_length(num) {this.max_range = num;}
	step(living_nodes) {
		this.update_quad_tree(living_nodes);
		this.update_collections(living_nodes);


	}
	update_quad_tree(living_nodes){this.quadTree.reset_graph(living_nodes);}
	update_collections(livingNodes) {
		livingNodes.forEach(node => node.update())
		this.handle_eat(livingNodes);
	}
	reward_triangles(triangles) {
		triangles.forEach(triangle => {
			let reward_type =  250
            if(triangle.every((node,i,arr)=>node.type==arr[(i+1)%arr.length==0]).type) reward_type=100
            if(triangle.every((node,i,arr)=>node.type!=arr[(i+1)%arr.length==0]).type) reward_type=500
			const area = this.triangle_area(triangle);
			const reward =Math.floor(Math.sqrt((area)/reward_type))
			console.log("reward is:",reward);
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
					eatee.Brain.fitness=1;
					eater.Brain.fitness=1;
					if (eater.type == eatee.type) {
						eater.change_type();
						eater.impulse_away_from(eatee);
						eatee.deactivate();
					} else {
						eatee.change_type();
						eatee.impulse_away_from(eater);
						eater.deactivate();
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
		console.time("pushnode");
		this.collections.push(new Node(randx, randy, randt, this, node_ID.next().value));
		console.timeEnd("pushnode");
		console.count("x");
	}
	find_fitest_node(nodes){return nodes.sort((a,b)=>b.Brain.fitness-a.Brain.fitness)[0]}
    get_living_nodes(){return this.collections.filter(x=>x.is_active)}
	reward(living_nodes){
		living_nodes.forEach(node=>node.update_fitness(0.01));
		living_nodes=this.fuck_over_wall_huggers(living_nodes);
		living_nodes.forEach(n=>n.update_fitness(n.connections.filter(x=>x.type===n.type).length)-n.connections.filter(x=>x.type!==n.type).length);
	//	const triangles = this.get_all_triangles(living_nodes);
	//	this.reward_triangles(triangles)
	}

	render() {
        const living_nodes = this.get_living_nodes();
		this.step(living_nodes);
		this.reward(living_nodes);
		this.emit();

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
##${pad("",5," ")}${pad(fitest_node.id,8," ")}${pad("",5," ")}${pad(`x:${fitest_node.x.toFixed(0)} ,y:${fitest_node.y.toFixed(0)}`,15," ")}${pad("",11," ")}${pad(fitest_node.Brain.fitness.toFixed(1),12," ")}${pad("",5," ")}${pad(fitest_node.connections.length.toString(),14," ")}${pad("",21," ")}##
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
		const sum = this.collections.reduce((acc,item)=>{acc+=item.Brain.fitness;return acc},0)

		const total = this.collections.length;
		const average = sum/total;
		return average
	}
	run(that) {
 		if (that.stop==true) return
		if (that.render_count > that.max_render_count) that.evaluate()
		else that.render();
	}
	new_game(winning_node) {
		this.set_render_count();
		console.log("winning node - type",winning_node);
		const fitness_win = winning_node.Brain.fitness >= this.best_fitness;
		const average_fitness = this.get_average_fitness();
		this.last_average_fitness=average_fitness;
		this.best_average_fitness=average_fitness>this.best_average_fitness?average_fitness:this.best_average_fitness;
		this.best_fitness = this.best_fitness > winning_node.Brain.fitness ? this.best_fitness : winning_node.Brain.fitness;
		this.champion = fitness_win ? winning_node.Brain:this.champion;
        this.scatter_nodes();
		this.neat_algorithm(winning_node); 
		this.reactivate_nodes();
	}
    neat_algorithm(wn){
		console.time("neat");
		console.log("!!!NEAT ALOGORITHM");
        const pool = this.get_mating_pool();
        this.set_next_brains(pool,wn,this.champion)


		console.log("NEAT ALOGORITHM!!!!")
		console.timeEnd("neat");		
//console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n");
    };
    seperate_into_species(){
        const species_pool=[];
		

        let ln = this.get_living_nodes();
        while(ln.length>0){
			const ri = Math.floor(Math.random()*ln.length);
            
			const random_species_sample=ln[ri]
			species_pool.push([random_species_sample]);//new species by some random living node
			random_species_sample.species=random_species_sample.species||species_pool.length;
			ln=ln.filter(x=>x.id!=random_species_sample.id);
			const removed=[];
            for(let i=0;i<ln.length;i++){
                if(this.determin_species(random_species_sample.Brain,ln[i].Brain)){ //template 
					const li = species_pool.length-1; //last index
                    species_pool[li].push(ln[i])
					ln[i].species=li;
					removed.push(ln[i].id);
				}
            }
            ln=ln.filter(x=>!removed.some(y=>y==x.id));//remove those that were pushed in the for loop.
        }
		if(species_pool.length<5){
			this.species_threshold+=0.05
		}else if(species_pool.length>5){
			this.species_threshold-=0.05

		}
        return species_pool;
    }
    determin_species(template,sample){
        if(! template)return true //first 1 
        //cd = e+d+w|
        const e = template.connections.reduce((acc,con)=>acc+=(sample.connections.find(c=>c.in_id==con.in_id)?0:1),0);
        const d = template.connections.reduce((acc,con)=>acc+=(sample.  connections.find(c=>c.in_id==con.in_id)?0:1),0)+
                    sample.connections.reduce((acc,con)=>acc+=(template.connections.find(c=>c.in_id==con.in_id)?0:1),0)
        const w = template.connections.reduce((acc,con)=>acc+=(con.weight-(sample.  connections.find(c=>c.in_id==con.in_id)?.weight||0)),0)
        const cd = e + d + w;
        return Math.abs(cd)>this.species_threshold;

    }
	get_mating_pool(){
        console.log("getting mating pond");
		const mating_pond = this.seperate_into_species();
        const mating_nodes = mating_pond.reduce((acc,species)=>{
            species.sort((a,b)=>a.Brain.fitness-b.Brain.fitness)
			const surviving_half = species.slice(Math.floor((species.length-1)/2))
            surviving_half.forEach(sh=>acc.push(sh))
            return acc;
        },[])

		const mating_pool=[];

		console.log("mating pond length",mating_pond.length)
		mating_nodes.forEach(node=>{
			if(!node){console.log('what the what?',mating_nodes.length);return}
			let mate_fitness = do_to_co(node.Brain.fitness,[0.1,this.best_fitness*2],[0.001,100])
			for(let i =0;i<mate_fitness;i++){
				mating_pool.push(node);
			}
		})
		if(mating_pool.length<3){
			mating_pool.push(this.collections[Math.floor(Math.random()*this.collections.length)])
			mating_pool.push(this.collections[Math.floor(Math.random()*this.collections.length)])
			mating_pool.push(this.collections[Math.floor(Math.random()*this.collections.length)])
		}
		return mating_pool
	}
	set_next_brains(mating_pool,winning_node,champion){
		console.log("mating pool leng",mating_pool.length);
        this.collections.forEach((node,i,arr)=>{
            if((node.id!==winning_node.id)){ // we skip the winning node - ensuring that it stays the same
                if(i==0 || (i==1 && winning_node.id==arr[0].id)){
                    node.become_child_of(champion,champion);
                    return;
                }
                //p value weights in perceptron cells change by
                //g is guard against mutation value - a higher number 
				const p1 = Math.floor(Math.random()*(mating_pool.length-1))										
                const parent_1 = mating_pool[p1].Brain;
				let filtered_pool = mating_pool.filter(x=>x.id!=parent_1.id);
                let p2 = Math.floor(Math.random()*(filtered_pool.length-1))
                let parent_2 = filtered_pool[p2]?.Brain||champion;
                node.become_child_of(parent_1,parent_2);
                
				const p = Math.tanh(parent_1.fitness/parent_2.fitness);

				const g = 0.101;//node.fitness/((this.best_fitness+winning_node.fitness)/2);	
				if(isNaN(p)){
					console.log(p,g,"something wrong captain");
					
				}
                node.mutate_next(p,g)		
            }
        })
		console.log("mating finsihed");

	}
    reactivate_nodes(){this.collections.forEach(node=>node.set_is_activated(true))}
    scatter_nodes(){this.collections.forEach(node=>node.scatter())}
	fuck_over_wall_huggers(ln){
		ln.forEach(c=>{
			if(c.x<=0||c.y<=0||c.x>=this.width||c.y>=this.height){
				c.set_is_activated(false);
			}
		})
		return ln
	}
	evaluate() {
		console.log("\n\nwinner winner chicken dinner\n\n")
		const survivers = this.get_living_nodes();
		this.fuck_over_wall_huggers(survivers)
		const winners = this.get_living_nodes();


		this.best_living_count=winners.length>this.best_living_count?winners.length:this.best_living_count;
		const fitest = this.find_fitest_node(winners);
		if (!fitest) {console.log("the terror!")};
		console.log("fitest node is:");

		console.log(fitest.id);
		console.log(fitest.Brain.fitness.toFixed(1), "vs champion of:", this.best_fitness.toFixed(1))
		console.log("this was the fitest node: ",fitest.win_count)
		console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n")

		
		if(this.game_count==this.epoc_level){
			console.log(fitest.Brain.fitness,"last call");
			return
		}
		this.new_game(fitest);
		
	}

	full_json_data(){
		const ln = this.get_living_nodes();
		const game_stats = this.get_game_stats();		
		const nodes = this.collections.map(x=>x.shallow_copy());
		const brain = this.examined_brain.copy_data();
		const triangles = this.get_all_triangles(ln).map(x=>x.map(y=>y.id));

		return {game_stats,nodes,triangles,brain}	
	}
	get_selected_node(selected_id){return this.collections.find(x=>x.id==selected_id)}
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
			notice_range:this.notice_range,
			visual_range:this.visual_range,
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
export default Neat_Controller