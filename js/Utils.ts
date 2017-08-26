class Point{
    x: number;
    y: number;

    constructor(x: number, y:number){
        this.x = x;
        this.y = y;
    }

    public Copy(): Point{
        return new Point(this.x, this.y);
    }
    
    public Add(p: Point | {x: number, y: number}){
        this.x += p.x;
        this.y += p.y;
    }
    public AddC(p: Point | {x: number, y: number}): Point{
        return new Point(this.x + p.x, this.y + p.y);
    }

    public Subtract(p: Point | {x: number, y: number}){
        this.x -= p.x;
        this.y -= p.y;
    }
    public SubtractC(p: Point | {x: number, y: number}): Point{
        return new Point(this.x - p.x, this.y - p.y);
    }

    public Clamp(
        p1: Point | {x: number, y: number}, 
        p2: Point | {x: number, y: number}
    ){
        if(this.x < p1.x) this.x = p1.x;
        if(this.y < p1.y) this.y = p1.y;
        if(this.x > p2.x) this.x = p2.x;
        if(this.y > p2.y) this.y = p2.y;
    }

    public Scale(s: number){
        this.x *= s;
        this.y *= s;
    }
    public ScaleC(s: number): Point{
        return new Point(this.x * s, this.y * s);
    }
}

function deepCopy(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = deepCopy(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = deepCopy(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


export {Point};
