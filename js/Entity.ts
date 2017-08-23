import {Point} from "./Utils"

class Entity{
    id: number;
    name: string;
    position: Point;

    control_behavior: any;

    constructor(name: string, p: Point | {x: number, y:number}){
        this.name = name;
        this.position = new Point(p.x, p.y);
    }
    AddProperty(n: string, value: any): Entity{
        this[n] = value;
        return this;
    }
}