

function *ID(){
    let i = 0;
    while(true){
        yield i++
    }
}
const IDgen = ID();

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