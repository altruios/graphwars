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
    draw_brain_connections(brain,y_offset){
        const active_conns = brain.connections.filter(x=>x.is_active)
        const arr = brain.cells.filter(x=>x.is_active);
        active_conns.forEach((conn,i)=>{
            if(conn.is_active==false) return
            const cell = brain.cells.find(x=>x.id==conn.n1);
            const cell2 = brain.cells.find(x=>x.id==conn.n2);
            const depth = arr.filter(x=>x.layer_number==cell.layer_number).length;
            const depth2 = arr.filter(x=>x.layer_number==cell2.layer_number).length;
            const x1=cell.layer_index * (this.s_canvas.width/depth)  +5+(this.s_canvas.width/depth)/3
            const x2=cell2.layer_index * (this.s_canvas.width/depth2)+5 +(this.s_canvas.width/depth2)/3
            const y1= cell.layer_number*this.s_canvas.height/30+y_offset
            const y2= cell2.layer_number*this.s_canvas.height/30+y_offset
            this.s_ctx.lineWidth = Math.abs(conn.weight*cell.activation_value+cell.bias)*1.82;
            this.s_ctx.strokeStyle=conn.weight>0?"#0000ff":"#ff0000";
            this.s_ctx.beginPath();
            this.s_ctx.moveTo(x1,y1);
            this.s_ctx.lineTo(x2,y2);
            this.s_ctx.stroke();
        })
    }
    draw_brain_cells(brain,y_offset){
        const active_cells = brain.cells.filter(x=>x.is_active)
        active_cells.forEach((cell,i,arr)=>{
            const depth = arr.filter(x=>x.layer_number==cell.layer_number).length;
            this.s_ctx.fillStyle=cell.is_hidden_layer==true?cell.activation_value>0?"#ffff00":"#00ffff":cell.activation_value>0?"#ff0000":"#0000ff";
                const x =(cell.layer_index * (this.s_canvas.width/depth)+(this.s_canvas.width/depth)/3);
                const y= cell.layer_number*this.s_canvas.height/30+y_offset;
                this.s_ctx.beginPath();
                this.s_ctx.arc(x,y,Math.abs(cell.activation_value)*35+5,0,Math.PI*2);
                this.s_ctx.lineWidth=Math.abs(cell.bias)*3
                this.s_ctx.fill();
                this.s_ctx.strokeStyle=cell.bias>0?"#ffff00":"#ffffff"
                this.s_ctx.stroke();
        })
    }
    draw_brain(brain){
        this.s_blank();
        const y_offset = 100;
        console.log(brain.cells.length,"is size");
        this.draw_brain_cells(brain,y_offset);
        this.draw_brain_connections(brain,y_offset);
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
            trig.forEach(node=>this.ctx.lineTo(Number(node.x),Number(node.y)))
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
        console.timeEnd("draw")
    }
    highlight_target_node(ln,nodeid){
        this.ctx.fillStyle=`rgba(255,0,0,.2)`;
        const tn=ln.find(x=>x.id==nodeid);
        if(!tn){return}
        this.ctx.beginPath();
        this.ctx.arc(tn.x,tn.y,this.data.game_stats.visual_range,0,Math.PI*2);
        this.ctx.fill()
        this.ctx.fillStyle=`rgba(0,255,255,.2)`;
        this.ctx.beginPath();
        this.ctx.arc(tn.x,tn.y,this.data.game_stats.notice_range,0,Math.PI*2);
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
    update_brain_display(brain){
        removeAllChildNodes(this.display);

        const cell_table = document.createElement("table");
        const cell_table_header = document.createElement("thead");
            for(const prop in brain.cells[0]){
                const table_cell = document.createElement("td");
                table_cell.innerText=prop;
                cell_table_header.appendChild(table_cell);
            }
        
        const cell_table_rows = brain.cells.map(cell=>{

            const cell_table_row = document.createElement("tr");
            for(const prop in cell){
                const table_cell = document.createElement("td");
                table_cell.style.backgroundColor=color(cell[prop]);
                table_cell.innerText=cell[prop];
                cell_table_row.appendChild(table_cell);
            }
            return cell_table_row;
        })
        
        cell_table.appendChild(cell_table_header);
        cell_table_rows.forEach(row=>cell_table.appendChild(row));


        const connections_table = document.createElement('table');
        const connections_table_header = document.createElement("thead");
        for(const prop in brain.connections[0]){
            const conn_prop = document.createElement("td");
            conn_prop.innerText=prop;
            connections_table_header.appendChild(conn_prop);
        }
        const connections_table_rows = brain.connections.map(conn=>{
            const conn_table_row = document.createElement("tr");
            for(const prop in conn){
                const isCellID=brain.cells.find(x=>x.id==conn[prop]);

                const conn_cell = document.createElement("td");
                conn_cell.style.backgroundColor=isCellID?color(isCellID.is_active):color(conn[prop]);
                conn_cell.innerText=conn[prop];
                conn_table_row.appendChild(conn_cell);
            }
            return conn_table_row
        })
        connections_table.appendChild(connections_table_header);
        connections_table_rows.forEach(row=>connections_table.appendChild(row));


        this.display.appendChild(cell_table);
        this.display.appendChild(connections_table);
    }
    update_display(data){
        this.update_meta_data_display(data.game_stats)
        this.update_brain_display(data.brain)
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
        this.draw(data.nodes.filter(x=>x.is_active==true),data.triangles,data.brain);
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
const compare_is_active = (a,b)=>(a.is_active===b.is_active)?0:a.is_active?-1:1
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
const color=(value)=>!isNaN(value)?value>0?"#99ff99":"#ff9999":"#ffffff";
