class Board {
	constructor(canvas,display,hdisplay,canvas2) {
        this.display=display;
        this.header_display=hdisplay
		this.height = canvas.height;
		this.width = canvas.width;
		this.canvas = canvas;
        this.target_node="";
		this.ctx = canvas.getContext("2d");
		this._draw_text_flag = true;
		this._draw_vision_flag = false;
		this.bg_color = "#000000";
        this.render_speed=30;

        this.s_canvas=canvas2;
        this.s_ctx=canvas2.getContext("2d");
        this.s_width=canvas2.width; 
        this.s_height=canvas2.height;
	}

    get_node_color(node){
        return node.type=="A"?"#FF0000":node.type=="B"?"#0000FF":node.type=="C"?"#00FF00":"#afafaf"    
    }
    s_blank(){
        this.s_ctx.fillStyle="#000000";
        this.s_ctx.fillRect(0,0,this.s_canvas.width,this.s_canvas.height);
    }
    draw_brain_connections(brain){
        const active_conns = brain.connections.filter(x=>x.is_active)
        const arr = brain.cells.filter(x=>x.is_active);
        active_conns.forEach((conn,i)=>{
            if(conn.is_activated==false) return
            const cell = brain.cells.find(x=>x.id==conn.n1);
            const cell2 = brain.cells.find(x=>x.id==conn.n2);
            const depth = arr.filter(x=>x.layer_number==cell.layer_number).length;
            const depth2 = arr.filter(x=>x.layer_number==cell2.layer_number).length;

            const x1=cell.layer_index * (this.s_canvas.width/depth)  +5+(this.s_canvas.width/depth)/3+20
            const x2=cell2.layer_index * (this.s_canvas.width/depth2)+5 +(this.s_canvas.width/depth2)/3+20
            const y1= cell.layer_number*this.s_canvas.height/30+20
            const y2= cell2.layer_number*this.s_canvas.height/30+20
            this.s_ctx.lineWidth = Math.abs(conn.weight*cell.activation_value+cell.bias)*1.82;

            this.s_ctx.strokeStyle=conn.weight>0?"#0000ff":"#ff0000";
            this.s_ctx.beginPath();
            this.s_ctx.moveTo(x1,y1);
            this.s_ctx.lineTo(x2,y2);
            this.s_ctx.stroke();
        })
    }
    draw_brain_cells(brain){
        const active_cells = brain.cells.filter(x=>x.is_active)
        active_cells.forEach((cell,i,arr)=>{
            const depth = arr.filter(x=>x.layer_number==cell.layer_number).length;

            this.s_ctx.fillStyle=cell.is_hidden_layer==true?cell.activation_value>0?"#ffff00":"#00ffff":cell.activation_value>0?"#ff0000":"#0000ff";

                const x =(cell.layer_index * (this.s_canvas.width/depth)+(this.s_canvas.width/depth)/3);
                const y= cell.layer_number*this.s_canvas.height/30;
                
                this.s_ctx.fillRect(x,y,40,40)
        })
    }
    draw_brain(brain){
        //    console.log(brain);
        this.s_blank();
        console.log(brain.cells.length,"is size");
        this.draw_brain_cells(brain);

        this.draw_brain_connections(brain);



        this.s_ctx.fillStyle="#ffffff";
        this.s_ctx.font = 'bold 48px serif';
        this.s_ctx.fillText(brain.host_id,this.s_canvas.width/2,this.s_canvas.height-100)
    }
    draw_trianges(arr,nodes){
        
        const triangles = nodes.reduce((acc,node)=>{
            const triangle_paths = node.connections.reduce((ac,n2)=>{
                const avalible_paths = n2.connections.reduce((a,n3)=>{
                    if(n3.connections.some(y=>y.id==node.id)) a.push([node,n2,n3])
                    return a;
                },[]);
                if(avalible_paths.length>0){
                    console.log(avalible_paths);
                    ac.push(...avalible_paths)
                }
                return ac;

            },[])
            if(triangle_paths.length>0){
                acc.push(...triangle_paths);
            }
            return acc
        },[])

        console.log("triangles are",triangles)

        triangles.forEach(trig=>{
            if(trig.some(x=>x==undefined)) return
            
            this.ctx.beginPath();            
            const grd = this.ctx.createLinearGradient(
                Number(trig[0].x), 
                Number(trig[0].y), 
                (Number(trig[1].x) + Number(trig[2].x)) / 2, 
                (Number(trig[1].y) + Number(trig[2].y)) / 2)
            
            
			grd.addColorStop(0, this.get_node_color(trig[0]));
			grd.addColorStop(.5, this.get_node_color(trig[1]));
			grd.addColorStop(1, this.get_node_color(trig[2]));
			this.ctx.fillStyle = grd;
			this.ctx.beginPath();            
            this.ctx.moveTo(Number(trig[0].x),Number(trig[0].y))
            trig.forEach(node=>{
                this.ctx.lineTo(Number(node.x),Number(node.y));
            })
			this.ctx.fill(); 
            this.ctx.stroke();
        })
    }
	draw(living_nodes,triangles,brain) {
        console.time("draw")
        this.blank();
        this.draw_trianges(triangles,living_nodes);

		living_nodes.forEach(node => {
            node.connections.forEach(other_node => {
                this.ctx.strokeStyle = this.get_node_color(node);
                this.ctx.lineWidth = 2;
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
        this.highlight_target_node(living_nodes,brain.host_id);
     //   this.draw_target_node(target_node)
	
        console.timeEnd("draw")

    }

    highlight_target_node(ln,nodeid){
        this.ctx.fillStyle=`rgba(255,0,0,.2)`;
        const fittest_node=ln.find(x=>x.id==nodeid);
        this.ctx.beginPath();
        this.ctx.arc(fittest_node.x,fittest_node.y,this.data.game_stats.visual_range,0,Math.PI*2);
        this.ctx.fill()
        this.ctx.fillStyle=`rgba(0,255,255,.2)`;
        this.ctx.beginPath();

        this.ctx.arc(fittest_node.x,fittest_node.y,this.data.game_stats.notice_range,0,Math.PI*2);
        this.ctx.fill()

    }
    get_fitest_node(nodes){
        return nodes.sort((a,b) => b.fitness-a.fitness)[0]

    }
    update_meta_data_display(game_stats){

        removeAllChildNodes(this.header_display);
        const stats = game_stats;
        const stats_div = document.createElement('div');
        for(const prop in stats){
            const div = document.createElement('div');
            div.innerText = `${prop}:${stats[prop]}`
            stats_div.appendChild(div);
        }
        this.header_display.appendChild(stats_div)

    }
    update_node_data_display(data){

        removeAllChildNodes(this.display);

        const node_container_div = document.createElement('table');
        node_container_div.classList.add("nodetable")
       // const nodes = data.nodes.sort(compare_fitness).sort(compare_is_active);
        const nodes = data.nodes.sort(compare_fitness);
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
            const that = this;
            
            
            const color = node.is_activated==true?"alive":"dead";
            node_div.dataset.color=color
            node_div.classList.add("node_div")
            for(const prop in node){
                if(prop==="is_activated") continue
                const div = document.createElement('td');
                if(prop==="id"){
                    div.id=node[prop]
                    div.addEventListener('click',(e)=>{
                        console.log("clicked!@#!@#!@#");
                        const id = e.target.id;
                        console.log("id",id,e);
                        that.target_node=id;
                        console.log(that.target_node,"is now changed?");
                    })
                }
                

                div.classList.add(prop);
                div.dataset.color=color;
                if(Array.isArray(node[prop])){
                    div.innerText = node[prop].length

                }
                else if(!isNaN(node[prop])&& typeof node[prop] !== "boolean"){

                    div.innerText = node[prop]
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
    update_display(data){
        //at this point -- react?
        //console.log(data);


        this.update_meta_data_display(data.game_stats)
     //   this.update_node_data_display(data);
    }
	blank() {
		this.ctx.fillStyle = this.bg_color;
		this.ctx.fillRect(0, 0, this.width, this.height)
        
	}
	blank_coloring() {
		this.bg_color = this.bg_color == "#000000" ? "#FFFFFF" : "#000000"
        return this.bg_color
	}
    async set_height_and_width(data){
        this.canvas.height = data.game_stats.height;
        this.canvas.width = data.game_stats.width;
        this.height = data.game_stats.height;
        this.width = data.game_stats.width;
    }
    next_image(data){
        console.time("next_image")

        this.set_height_and_width(data)


        this.data=data;
        this.draw(data.nodes.filter(x=>x.is_activated==true),data.triangles,data.brain);
        this.draw_brain(data.brain);
        this.render_count=data.render_count;

        this.update_display(data); //time for a framework react... redux?
        console.timeEnd("next_image")

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

}
//god why can't i just import these
const do_to_co=(val,o_r,n_r)=>(val - o_r[0]) * (n_r[1] - n_r[0]) / (o_r[1] - o_r[0]) + n_r[0]
const do_to_pos=(val,o_r)=>do_to_co(val,o_r,[0,1]);
const do_to_real=(val,o_r)=>do_to_co(val,o_r,[-1,1]);
const compare_fitness = (a,b)=> b.fitness - a.fitness
const typer =(t)=>t=="A"?"#ff0000":t=="B"?"#00ff00":"#0000ff";

const compare_is_active = (a,b)=>(a.is_activated===b.is_activated)?0:a.is_activated?-1:1
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}