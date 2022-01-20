class Board {
	constructor(canvas, canvas2, count) {
		this.cell_count = count;
		this.height = canvas.height;
		this.width = canvas.width;
        this.test1=null;
        this.s_width=canvas2.width;
        this.s_height=canvas2.height;
		this.canvas = canvas;
        this.s_canvas=canvas2;
		this.ctx = canvas.getContext("2d");
        this.s_ctx=canvas2.getContext("2d");
		this.collections = [];
		this.best_fitness = 0;
		this._draw_text_flag = true;
		this._draw_vision_flag = false;
		this.max_render_count = 350;
		this.bg_color = "#000000";
		this.catch_range = 100;
		this.max_range = 200;
		this.render_count = 0;
		this.game_count = 0;
		this.render_speed = 1;
	}

	draw(living_nodes) {
		const triangles = this.get_all_triangles(living_nodes);
		this.reward_triangles(triangles)
		triangles.forEach(trig => {
			const grd = this.ctx.createLinearGradient(trig[0].x, trig[0].y, (trig[1].x + trig[2].x) / 2, (trig[1].y + trig[2].y) / 2)
			grd.addColorStop(0, trig[0].color);
			grd.addColorStop(.5, trig[1].color);
			grd.addColorStop(1, trig[2].color);
			this.ctx.fillStyle = grd;
			this.ctx.beginPath();
			this.ctx.moveTo(trig[0].x, trig[0].y);
			this.ctx.lineTo(trig[1].x, trig[1].y);
			this.ctx.lineTo(trig[2].x, trig[2].y);
			this.ctx.fill();
		})
		living_nodes.forEach(node => node.draw_connections(this.ctx));
		living_nodes.forEach(node => node.draw_self(this.ctx));
        this.draw_fittest_nodes_info();
        this.highlight_fittest_node();
		this.display();
	}
    highlight_fittest_node(){
        const color = this.bg_color=="#000000"?`rgba(255,255,255,0.3)`:`rgba(0,0,0,0.3)`
        this.ctx.fillStyle=color;
        const fittest_node=this.get_fitest_node();
        this.ctx.beginPath();
        this.ctx.arc(fittest_node.x,fittest_node.y,fittest_node.r+20,0,Math.PI*2);
        this.ctx.fill()
    }
    draw_fittest_nodes_info(){
        const fitest_node = this.get_fitest_node();
        const fittest_node_brain_array = fitest_node.Brain.matrix;
        const start_bucket = [];
        const h_of_a = fitest_node.Brain.height-1;
        for(let i=0;i<h_of_a+1;i++){
            start_bucket.push([]);
        }
        const fittest_brain_matrix = fittest_node_brain_array.reduce((matrix,cell,ci,arr)=>{
            matrix[cell.height].push(cell)
            return matrix
        },start_bucket);



        
        this.s_ctx.fillStyle="#000000";
        const row_count = fittest_brain_matrix.length;
        const col_counts = fittest_brain_matrix.map(row=>row.length);
        const longest_col_len = fittest_brain_matrix.map(row=>row.length).sort((a,b)=>b-a)[0];
        const scale_y = this.s_canvas.height / row_count;
        const scale_r = 30;
        for(let y=0;y<row_count;y++){

            for(let x=0;x<col_counts[y];x++){
                const scale_x = this.s_canvas.width / col_counts[y];

                const cell = fittest_brain_matrix[y][x];
                const draw_x = scale_x*x+scale_x/2;
                const draw_y = scale_y*y+scale_y/2;
                const draw_r = Math.abs(cell.activation_value*scale_r);
                const is_pos = cell.activation_value>0
                const border_color = is_pos?"#0000ff":"#ff0000"
                const border_width = cell.bias*scale_r*2;
                const color_val=Math.floor(MapRange(cell.activation_value,[-1,1],[100,255]));
                
                const draw_c = `rgb(${color_val},${is_pos?color_val:40},${is_pos?color_val:40})`


                cell.connections_backwards.forEach((other_cell,bi)=>{
                    const c_v_w=MapRange(cell.connections_backwards[bi].activation_value,[-1,1],[0,255]);
                    const is_neg = cell.connections_backwards[bi].activation_value<0?true:false;
                    const wl =  MapRange(c_v_w,[0,255],[1,5])
                    const draw_w = `rgb(${is_neg?c_v_w:0},${is_neg?0:c_v_w},${0})`
                    this.s_ctx.strokeStyle=draw_w;
                    this.s_ctx.lineWidth=wl;
                    this.s_ctx.beginPath();
                    this.s_ctx.moveTo(draw_x,draw_y);
                    const last_scaled_x = this.s_canvas.width / col_counts[y-1]
                    this.s_ctx.lineTo(last_scaled_x*(bi)+last_scaled_x/2,scale_y*(y-1)+scale_y/2);
                    this.s_ctx.stroke();

                })


                this.s_ctx.strokeStyle=border_color;
                this.s_ctx.lineWidth=border_width;
                this.s_ctx.fillStyle=draw_c;
                this.s_ctx.beginPath();
                this.s_ctx.arc(draw_x,draw_y,draw_r,0,2*Math.PI)
                this.s_ctx.fill();
//                this.s_ctx.stroke();

            }
        }
        this.s_ctx.fill();
        this.s_ctx.font='36pt Times';

        this.s_ctx.fillText(`fit:${fitest_node.fitness}`,this.s_canvas.width/2 - 200,50);

        this.s_ctx.fillText(`x:${(fitest_node.x).toFixed(0)},y:${(fitest_node.y.toFixed(0))}`,this.s_canvas.width/2,50);





    }
	display() {
		const fitest = this.get_fitest_node();
		const outputs = ["x1", 
        "x2", 
        "y1", 
        "y2", 
        "mutate", 
        "will_mutate_weights", 
        "weights_mutation", 
        "will_mutate_bias", 
        "bias_mutation", 
        "decide to learn small", 
        "decide to learn big"]

        
        
        
        const inputs = ["last x1",
        "last x2",
        "last y1",
        "last y2",
        "length of close proximity type A",
        "distance of shortest close proximity type A or -1",
        "length of close proximity type B",
        "distance of shortest close proximity type B or -1",
        "length of close proximity type B",
        "distance of shortest close proximity type C or -1",
        "length of mid proximity type A",
        "distance of shortest mid proximity type A or -1",
        "length of mid proximity type B",
        "distance of shortest mid proximity type B or -1",
        "length of mid proximity type B",
        "distance of shortest mid proximity type C or -1",
        "length of long proximity type A",
        "distance of shortest long proximity type A or -1",
        "length of long proximity type B",
        "distance of shortest long proximity type B or -1",
        "length of long proximity type B",
        "distance of shortest long proximity type C or -1",
        "average fitness related to type A in close proximity",
        "average fitness related to type B in close proximity",
        "average fitness related to type C in close proximity",
        "average fitness related to type A in mid proximity",
        "average fitness related to type B in mid proximity",
        "average fitness related to type C in mid proximity",
        "average fitness related to type A in long proximity",
        "average fitness related to type B in long proximity",
        "average fitness related to type C in long proximity",
        "host radius",
        "host relative value - x to center",
        "host relative value - y to center",
        "host fitness"    
    ]

        




        DISPLAY.innerText = `render_count:${this.render_count}

        game_count ${this.game_count}

        cell_count:${this.collections.length}, ${this.get_living_nodes().length}

 

        fitest cell: ${fitest.id}, (${fitest.x.toFixed(2)},${fitest.y.toFixed(2)}) ${fitest.last_performance.toFixed(2)}

 

        f-current: ${this.get_fitest_node().fitness}

 

        f-record:${this.best_fitness}

 

        brain info:

        mutations taken for whole brain: ${fitest.Brain.mutation_counter}

 

        ${fitest.Brain.get_output().map((x,i)=>`output${i}: ${x.toFixed(2)} ${outputs[i]}\n`)}

 

        ${fitest.Brain.get_input_cells().map((x,i)=>`input${i}:${x.activation_value.toFixed(3)} ${inputs[i]} \n`)}

        x:${(fitest.Brain.last_move_vec[0]/fitest.Brain.last_move_vec[1]).toFixed(3)},y:${(fitest.Brain.last_move_vec[2]/fitest.Brain.last_move_vec[3]).toFixed(3)}

 

        `
		const old_display = document.getElementById('brain_display_div')
		old_display?.remove();
		const new_display = fitest.Brain.display();
		document.body.appendChild(new_display);
	}

	blank() {
		this.ctx.fillStyle = this.bg_color;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        
		this.s_ctx.fillStyle = this.blank_coloring();
        this.blank_coloring()//and reset
        this.s_ctx.fillRect(0,0,this.s_width,this.s_height);
        this.s_ctx.fill();
	}
	blank_coloring() {
		this.bg_color = this.bg_color == "#000000" ? "#FFFFFF" : "#000000"
        return this.bg_color
	}

	request_last_image_from_server() {
		this.blank()
        const image_data = fetch("/last_image").then(x=>x.json());
		this.draw(image_data);
		this.render_count=image_count.render_count;
	}
	run(game_time){
		const that = this;
		const engine=window.setInterval(()=>that.request_last_image_from_server(), this.render_speed)
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