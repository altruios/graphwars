class Board {
	constructor(canvas,display,hdisplay) {
        this.display=display;
        this.header_display=hdisplay
		this.height = canvas.height;
		this.width = canvas.width;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this._draw_text_flag = true;
		this._draw_vision_flag = false;
		this.bg_color = "#000000";
        this.render_speed=30;
	}
    get_node_color(node){
        return node.type=="A"?"#FF0000":node.type=="B"?"#0000FF":node.type=="C"?"#00FF00":"#afafaf"    
    }
	draw(living_nodes,triangles,quad_tree) {
        this.blank();

		triangles.forEach(trig => {
			const grd = this.ctx.createLinearGradient(trig[0].x, trig[0].y, (trig[1].x + trig[2].x) / 2, (trig[1].y + trig[2].y) / 2)
			grd.addColorStop(0, this.get_node_color(trig[0]));
			grd.addColorStop(.5, this.get_node_color(trig[1]));
			grd.addColorStop(1, this.get_node_color(trig[2]));
			this.ctx.fillStyle = grd;
			this.ctx.beginPath();
			this.ctx.moveTo(trig[0].x, trig[0].y);
			this.ctx.lineTo(trig[1].x, trig[1].y);
			this.ctx.lineTo(trig[2].x, trig[2].y);
			this.ctx.fill();
		})
		living_nodes.forEach(node => {
            node.connections.forEach(other_node => {
                const grd = this.ctx.createLinearGradient(node.x,node.y,other_node.x,other_node.y);
                grd.addColorStop(0,this.get_node_color(node));
                grd.addColorStop(1,this.get_node_color(other_node));

                this.ctx.strokeStyle = grd;
                this.ctx.lineWidth = other_node.r > node.r ? node.r / 2 : other_node.r / 2;
                this.ctx.beginPath();
                this.ctx.moveTo(node.x, node.y);
                this.ctx.lineTo(other_node.x, other_node.y);
                this.ctx.stroke();
            })


        });
		living_nodes.forEach(node => {
            const result = Math.floor(node.scream*node.fitness*node.radius);
            const col1 = Math.floor(do_to_co(Math.sin(result),[-1,1],[55,200]));
            const cos2 = Math.floor(do_to_co(Math.cos(result),[-1,1],[55,200]));
            this.ctx.fillStyle = this.get_node_color(node);
            this.ctx.lineWidth=Math.abs(result);
            this.ctx.strokeStyle=`rgba(${col1},${255},${cos2},${Math.abs(node.scream)})`
                        
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.r, 0, 2 * Math.PI)
            this.ctx.fill();
            this.ctx.stroke();

            if(this._draw_text_flag==true){
                this.ctx.fillStyle = "#00ff00"
                this.ctx.font = '20px serif';
                this.ctx.fillText(node.id, node.x, node.y + 20);
                this.ctx.fillStyle = "#ff00ff"
                this.ctx.fillText(node.fitness, node.x, node.y - 5);
            }

        });
        this.highlight_fittest_node(living_nodes);
	}

    highlight_fittest_node(nodes){
        const color = this.bg_color=="#000000"?`rgba(255,255,255,0.3)`:`rgba(0,0,0,0.3)`
        this.ctx.fillStyle=color;
        const fittest_node=this.get_fitest_node(nodes);
        console.log("fittestnode",fittest_node.id,fittest_node.fitness)
        this.ctx.beginPath();
        this.ctx.arc(fittest_node.x,fittest_node.y,fittest_node.r+20,0,Math.PI*2);
        this.ctx.fill()
    }
    get_fitest_node(nodes){
        return nodes.sort((a,b) => b.fitness-a.fitness)[0]

    }
    draw_quad_tree(tree,dept){
        if(!tree)   return
        if(!dept)   dept=0;
        if(dept>255)dept=255

        this.ctx.strokeStyle=`rgb(${dept},${255-dept},${dept})`;
        this.ctx.lineWidth=5;
        this.ctx.strokeRect(tree.x,tree.y,tree.w,tree.h);
        this.ctx.stroke();
        this.draw_quad_tree(tree.tl,dept+40)
        this.draw_quad_tree(tree.tr,dept+40)
        this.draw_quad_tree(tree.bl,dept+40)
        this.draw_quad_tree(tree.br,dept+40)
    }
    update_display(data){
        //at this point -- react?
        console.log(data);
        removeAllChildNodes(this.display);
        removeAllChildNodes(this.header_display);
        const stats = data.game_stats;
        const stats_div = document.createElement('div');
        for(const prop in stats){
            const div = document.createElement('div');
            div.innerText = `${prop}:${stats[prop]}`
            stats_div.appendChild(div);
        }
        this.header_display.appendChild(stats_div)
        const node_container_div = document.createElement('table');
        node_container_div.classList.add("nodetable")
       // const nodes = data.nodes.sort(compare_fitness).sort(compare_is_active);
        const living_nodes = data.nodes.filter(x=>x.is_activated==true);
        const dead_nodes = data.nodes.filter(x=>x.is_activated==false)
        dead_nodes.forEach(x=>{x.fitness=0.1})
        console.log(dead_nodes,"are dead nodes")
        const nodes = [...living_nodes.sort(compare_fitness),...dead_nodes.sort(compare_fitness)]
        //make head0
        const table_header = document.createElement('tr');
        for(let prop in nodes[0]){
            if(prop==="is_activated") continue
            if(prop==="connections") prop = "c"
            if(prop==="mutation_value") prop = "m"

            const div = document.createElement('th');
                div.innerText = prop
                table_header.appendChild(div);
                
            }
        node_container_div.appendChild(table_header);
        







        //make body
        for(const node of nodes){
            const node_div = document.createElement('tr');
            const color = node.is_activated==true?"alive":"dead";
            node_div.dataset.color=color
            node_div.classList.add("node_div")
            for(const prop in node){
                if(prop==="is_activated") continue
                const div = document.createElement('td');
                div.classList.add(prop);
                div.dataset.color=color;
                if(Array.isArray(node[prop])){
                    div.innerText = node[prop].length

                }
                else if(!isNaN(node[prop])&& typeof node[prop] !== "boolean"){

                    div.innerText = node[prop].toFixed(1)
                }
                else{
                    div.innerText =node[prop]
                }
                node_div.appendChild(div);
                
            }
           
            node_container_div.appendChild(node_div);
        }
        this.display.appendChild(node_container_div);
        
    }
	blank() {
		this.ctx.fillStyle = this.bg_color;
		this.ctx.fillRect(0, 0, this.width, this.height)
        
	}
	blank_coloring() {
		this.bg_color = this.bg_color == "#000000" ? "#FFFFFF" : "#000000"
        return this.bg_color
	}
    async set_height_and_width(){
        const data = await this.request_data();
        this.canvas.height = data.game_stats.height;
        this.canvas.width = data.game_stats.width;
        this.height = data.game_stats.height;
        this.width = data.game_stats.width;
    }
    async next_image(){
        const data = await this.request_data();
        this.data=data;
        this.draw(data.nodes.filter(x=>x.is_activated==true),data.triangles);
        this.draw_quad_tree(data.quad_tree)
        this.render_count=data.render_count;
     //   this.update_display(data);

    }
	request_data() {
        return  fetch("/get_current_data").then(data=> data.json());
	}
	run(){
		const that = this;
		const engine=window.setInterval(()=>that.next_image(), that.render_speed)
        this.engine=engine;
    }
    halt(){
        window.clearInterval(this.engine);
    }
	debug(sw) {
        if(sw==0){
            this._draw_vision_flag= !this._draw_vision_flag;
            this.collections.forEach(n => n.set_vision_text(this._draw_vision_flag));

        }
        else{
            this._draw_text_flag = !this._draw_text_flag;
	    	this.collections.forEach(n => n.set_draw_text(this._draw_text_flag));
	
        }
		}
	test(node) {
		console.log(node.Brain.predict(this.collections));
	}

}
//god why can't i just import these
const do_to_co=(val,o_r,n_r)=>(val - o_r[0]) * (n_r[1] - n_r[0]) / (o_r[1] - o_r[0]) + n_r[0]
const do_to_pos=(val,o_r)=>do_to_co(val,o_r,[0,1]);
const do_to_real=(val,o_r)=>do_to_co(val,o_r,[-1,1]);
const compare_fitness = (a,b)=> b.fitness - a.fitness
const compare_is_active = (a,b)=>(a.is_activated===b.is_activated)?0:a.is_activated?-1:1
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}