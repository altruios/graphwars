class Board {
	constructor(canvas,display) {
        this.display=display;
		this.height = canvas.height;
		this.width = canvas.width;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this._draw_text_flag = true;
		this._draw_vision_flag = false;
		this.bg_color = "#000000";
        this.render_speed=20;
	}
    get_node_color(node){
        return node.type=="A"?"#FF0000":node.type=="B"?"#0000FF":node.type=="C"?"#00FF00":"#afafaf"    
    }
	draw(living_nodes,triangles) {
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
            this.ctx.fillStyle = this.get_node_color(node);
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.r, 0, 2 * Math.PI)
            this.ctx.fill();
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
    update_display(data){
        //at this point -- react?
        console.log(data);
        removeAllChildNodes(this.display);
        const stats = data.game_stats;
        const stats_div = document.createElement('div');
        for(const prop in stats){
            const div = document.createElement('div');
            div.innerText = `${prop}:${stats[prop]}`
            stats_div.appendChild(div);
        }
        this.display.appendChild(stats_div)
        

        const nodes = data.nodes.sort(compare_fitness);
        for(const node of nodes){
            const node_div = document.createElement('div');
            node_div.style.display="flex";
            node_div.style.border="solid";
            node_div.style.flexFlow="column wrap"
            node_div.setAttribute('fitness',node.fitness)
            for(const prop in node){
                const div = document.createElement('div');
                if(Array.isArray(node[prop])){
                    div.innerText = `${prop}:${node[prop].length}`
                }else{
                    div.innerText = `${prop}:${node[prop]}`
                }
                node_div.appendChild(div);
                
            }
           
            this.display.appendChild(node_div);
        }
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
        this.draw(data.nodes,data.triangles);
        this.render_count=data.render_count;
        this.update_display(data);

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
const compare_fitness = (a,b)=> b.fitness - a.fitness
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}