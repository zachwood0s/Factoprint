import {Point} from "./Utils"

class Entity{
    id: number;
    name: string;
    position: Point;

    control_behavior: any;

    constructor(id:number, name: string, p: Point | {x: number, y:number}){
        this.id = id;
        this.name = name;
        this.position = new Point(p.x, p.y);
    }
    public LoadFromData(){
        let entity = DATA.entities.filter(function(value){
            return value.name == this.name;
        });
        console.log(entity);
    }
}

let DATA = {
    menu_types:[
        "transport-belts"
    ],
    entities: [
        {
            name: "transport-belt",
            direction: 1,
            type: "transport-belt",
            menu_type: "transport-belts",
            animations:{
                filename:"images\entity\transport-belt\transport-belt.png",
                width:40,
                height:40,
                frame_count: 16,
                
                horizontal:{
                    y:0
                },
                vertical: {
                    y:40
                },
                side_to_top:{
                    y:320
                },
                top_to_side:{
                    y:360
                },
                side_to_bottom:{
                    y:400
                },
                bottom_to_side:{
                    y:440
                }
            },
            
        },
    ]
}

export{
    DATA,
    Entity
}
