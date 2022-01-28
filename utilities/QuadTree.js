

function *ID(){
    let i = 0;
    while(true){
        yield i++
    }
}
const IDgen = ID();
class QuadTree{
    constructor(x,y,w,h,l,t){
        this.type=t;
        this.level=l;        
        this.capacity=11;
        this.points=[];
        this.divided=false;
        this.x=x;
        this.y=y;
        this.h=h;
        this.w=w;
        this.id =IDgen.next().value;
        this.tl = null;
        this.tr = null;
        this.bl = null;
        this.br = null;
    }
    no_function_copy(){
        return {

            capacity:this.capacity,
          //  points:this.points.map(x=>x.no_function_copy()),
            divided:this.divided,
            x:this.x,
            y:this.y,
            h:this.h,
            w:this.w,
            tl:this.tl?.no_function_copy(),
            tr:this.tr?.no_function_copy(),
            bl:this.bl?.no_function_copy(),
            br:this.br?.no_function_copy(),
        }



    }
    contains(point,range){
        if(!range) range = this;
        return (
            point.x >= range.x  &&
            point.x <= range.x + range.w &&
            point.y >= range.y  &&
            point.y <= range.y + range.h);
    }
    insert(point){
        if(!this.contains(point)){
            return false;
        }
        if(this.points.length<this.capacity){
            this.points.push(point)
            return true
        }else{
            if(this.divided==false){
                this.subdivide(point)
                this.divided=true;
            }
            if(this.tl.insert(point)){
                return true
            }else if(this.tr.insert(point)){
                return true
            }else if(this.bl.insert(point)){
                return true;
            }
            else if(this.br.insert(point)){
                return true;
            }else {
                return false
            }
        }
    }
    subdivide(point){
        const x=this.x;
        const y=this.y;
        const w=this.w/2;
        const h=this.h/2;
        const l =this.level+1;
        const t = this.type+">"
        this.tl = new QuadTree(x,y,w,h,l,this.type+">tl");
        this.tr = new QuadTree(x+w,y,w,h,l,this.type+">tr")
        this.bl = new QuadTree(x,y+h,w,h,l,this.type+">bl")
        this.br = new QuadTree(x+w,y+h,w,h,l,this.type+">br")
         
    }
    get_range(point,range){
        if(!range)range=1;
        return {
            x:point.x-range/2,
            y:point.y-range/2,
            h:range,
            w:range
        }
    }
    find(point,range){
        return this.query(this.get_range(point,range));
    }   
    query(range,found){
            //x y r
        if(!found){
            found=[];
        }

        if(!this.overlaps(range)){
            return found
        }else{
             for(let p of this.points){
                 if(this.contains(p,range)){
                    found.push(p);
                }
         
            }
        }
        if(this.divided){
            if(this.overlaps(range)){
                this.tl.query(range,found);
                this.tr.query(range,found);
                this.bl.query(range,found);
                this.br.query(range,found);
                return found
            }
        }

        return found;
    }
    valueInRange( value, min, max){ 
        return (value >= min) && (value <= max); 
    }
    intersects(range){
        const ph=range.h
        const pw=range.w;
        const px = range.x 
        const py = range.y 
        console.log(range,px,py,ph,pw,"should be rect corner for point,")
        return !( 
            px - pw > this.x + this.w ||
            px + pw < this.x - this.w || 
            py - ph > this.y + this.h ||
            py + ph < this.y - this.h)
    }
    overlaps(range){
        const xOverlap = this.valueInRange(range.x, this.x, this.x + this.w) ||
        this.valueInRange(this.x, range.x, range.x + range.w);
        const yOverlap = this.valueInRange(range.y, this.y, this.y + this.h) ||
        this.valueInRange(this.y, range.y, range.y + range.h);
        return xOverlap&&yOverlap
    }
    list_points(points){
        if(!points){
            points = [];
        }
        points.push(...this.points);
        this.tl?.list_points(points);
        this.tr?.list_points(points);
        this.bl?.list_points(points);
        this.br?.list_points(points);
        return points;
    }
    reset_graph(points){
        this.divided=false;
        this.points=[];

        this.tl=null;
        this.tr=null;
        this.bl=null;
        this.br=null;
        points.forEach(p=>this.insert(p));
    }

}
export default QuadTree
/*
class QuadTree{
    constructor(x,y,w,h){
        this.capacity=4;
        this.points=[];
        this.divided=false;
        this.x=x;
        this.y=y;
        this.h=h;
        this.w=w;
        this.id =IDgen.next().value;
        this.tl = null;
        this.tr = null;
        this.bl = null;
        this.br = null;
    }
    no_function_copy(){
        return {

            capacity:this.capacity,
          //  points:this.points.map(x=>x.no_function_copy()),
            divided:this.divided,
            x:this.x,
            y:this.y,
            h:this.h,
            w:this.w,
            tl:this.tl?.no_function_copy(),
            tr:this.tr?.no_function_copy(),
            bl:this.bl?.no_function_copy(),
            br:this.br?.no_function_copy(),
        }



    }
    contains(point){
        return (
            point.x >= this.x - this.w &&
            point.x <= this.x + this.w &&
            point.y >= this.y - this.h &&
            point.y <= this.y + this.h);
    }
    insert(point){
        if(!this.contains(point)){
            return false;
        }
        if(this.points.length<this.capacity){
            this.points.push(point)
            return true
        }else{
            if(this.divided==false){
                this.subdivide()
                this.divided=true;
            }
            if(this.tl.insert(point)){
                return true
            }else if(this.tr.insert(point)){
                return true
            }else if(this.bl.insert(point)){
                return true;
            }
            else if(this.br.insert(point)){
                return true;
            }else {
                return false
            }
        }
    }
    subdivide(){
        const x=this.x;
        const y=this.y;
        const w=this.w/2;
        const h=this.h/2;
        this.tl = new QuadTree(x,y,w,h);
        this.tr = new QuadTree(x+w,y,w,h)
        this.bl = new QuadTree(x,y+h,w,h)
        this.br = new QuadTree(x+w,y+h,w,h)
         
    }
    query(point,found,c){
        //x y r
        if(!found){
            found=[];
        }
        if(!c){
            c=0
        }
        if(!this.intersects(point)){
            return found
        }else{
            c++
             for(let p of this.points){
                 if(point.get_distance_from_center(p)<=point.ref.catch_range){
                    //if you are within the distance of catching a point - 
                    found.push(p);

                }
             }
        }
        if(this.divided){
            if(this.intersects(point)){
                this.tl.query(point,found,c);
                this.tr.query(point,found,c);
                this.bl.query(point,found,c);
                this.br.query(point,found,c);
                return found
            }
        }

        return found;
    }
    intersects(point){
        const size=point.ref.catch_range
        const px = point.x - size/2;
        const py = point.y - size/2;
        return !( 
            px - size > this.x + this.w ||
            px + size < this.x - this.w || 
            py - size > this.y + this.h ||
            py + size < this.y - this.h)
    }
}
export default QuadTree;
*/