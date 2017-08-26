import {Point} from "./Utils"
import {Editor, Animator} from "./index"
import {DrawHelper} from "./DrawHelper"

interface Properties{
    name: string,
    type: string,
    menu_type: string,
    grid_size: Point,
    animation?:{
        file_name: string,
        width: number,
        height: number,
        frame_count: number,
        ticks_per_frame: number,
        line_length?: number,
        shift?:{
            y: number,
            x: number
        }
    };
    transport_belt?: TransportBeltProperties;
    control_behavior?: any;
    tags: string[];
}
interface TransportBeltProperties{
    direction: number,
    direction_count: number,
    corner: number,
    animation: {
        horizontal: {y: number},
        vertical: {y: number},
        side_to_top: {y: number},
        top_to_side:{y:number},
        side_to_bottom:{y:number},
        bottom_to_side:{y:number}
    }
}


class Entity{
    id: number;
    position: Point;
    properties: Properties;

    constructor(id:number, p: Point | {x: number, y:number}){
        this.id = id;
        this.position = new Point(p.x, p.y);
    }
    public LoadFromData(name: string){
        let data_entity = Data.entities.filter((value)=>{
            return value.name == name;
        })[0];

        //Seems like kinda a hack deep-copy but we'll see if its really that slow
        this.properties = JSON.parse(JSON.stringify(data_entity));    
        //turns out that our deep copy doesn't keep the methods for Point soo... I'm gonna do that here
        this.properties.grid_size = data_entity.grid_size.Copy();
        
        if(!Editor.global_animators[this.properties.name]){
            Editor.global_animators[this.properties.name] = 
                new Animator(
                    this.properties.animation.frame_count,
                    this.properties.animation.ticks_per_frame
                );
        }
    }

    public Draw(ctx: CanvasRenderingContext2D, o: number){
        if(this.properties.animation){

            //Handle animation

            let flip_h = false;
            let flip_v = false;
            let image = Data.loaded_images[this.properties.name];
            let s = new Point(
                this.properties.animation.width * Editor.global_animators[this.properties.name].CurrentFrame(),
                0
            );
            let sD = new Point(
                this.properties.animation.width,
                this.properties.animation.height
            );
            //console.log(this.properties.grid_size);
            let dD = this.properties.grid_size
                .ScaleC(Editor.GRID_SIZE)
                .AddC(
                    {x: Editor.ENTITY_SCALEUP, y: Editor.ENTITY_SCALEUP}
                );
            
            if(this.properties.type == "assembling-machine"){
                let current_row = Math.floor(Editor.global_animators[this.properties.name].CurrentFrame()/this.properties.animation.line_length);
                let current_column = Editor.global_animators[this.properties.name].CurrentFrame()-(current_row * this.properties.animation.line_length)
                s.y = current_row * this.properties.animation.height + (current_row+1) * this.properties.animation.shift.y;
                s.x = current_column*this.properties.animation.width;
                //console.log(s);
            }
            else if(this.properties.type == "transport-belt"){
  
                if(this.properties.transport_belt.direction == 0){                  
                    //...I think I might have gotten a little carried away with the depth here....
                    s.y = this.properties.transport_belt.animation.vertical.y;
                }
                else if(this.properties.transport_belt.direction == 2){
                    s.y = this.properties.transport_belt.animation.horizontal.y;
                }
                else if(this.properties.transport_belt.direction == 4){
                    s.y = this.properties.transport_belt.animation.vertical.y;
                    flip_v = true;
                }
                else if(this.properties.transport_belt.direction == 6){
                    s.y = this.properties.transport_belt.animation.horizontal.y;
                    flip_h = true;
                }
            }
            DrawHelper.DrawImage(
                ctx, 
                image, 
                s, 
                sD, 
                this.position
                    .ScaleC(Editor.GRID_SIZE)
                    .SubtractC(
                        {x:Editor.ENTITY_SCALEUP/2, y:Editor.ENTITY_SCALEUP/2}
                    ), 
                    dD, 
                    {
                        opacity: o,
                        flip_horizontal: flip_h,
                        flip_vertical: flip_v
                    }
                ); 
        }
    }
    public SetDirection(d: number){
        if(this.properties.tags.indexOf("rotatable") > -1){
            if(this.properties.type == "transport-belt"){
                this.properties.transport_belt.direction = d;
            }
        }
    }
    public GetDirection():number{
        if(this.properties.type == "transport-belt"){
            return this.properties.transport_belt.direction;
        }
        return 0;
    }
    public Rotate(){
        if(this.properties.type == "transport-belt"){
            this.properties.transport_belt.direction+=2;
            if(this.properties.transport_belt.direction > this.properties.transport_belt.direction_count){
                this.properties.transport_belt.direction = 0;
            }
        }
    }
}

class Data{
    static loaded_images: HTMLImageElement[] = [];
    static menu_types:string[];
    static entities: Properties[];

    static LoadImages(){
        for(let entity of this.entities){
            if(entity.animation){
                if(!this.loaded_images[entity.name]){
                    let new_image = new Image();
                    new_image.src = entity.animation.file_name;
                    this.loaded_images[entity.name] = new_image;
                }
            }
        }
    }
}
Data.menu_types = [
    "transport-belts",
    "assembling-machines",
];
Data.entities = [
    {
        name: "transport-belt",
        type: "transport-belt",
        menu_type: Data.menu_types[0],
        grid_size:new Point(1,1),
        animation:{
            file_name: "images\\entity\\transport-belt\\transport-belt.png",
            width:40,
            height:40,
            ticks_per_frame: 0,
            frame_count:16,
        },
        transport_belt: {
            direction: 0,
            direction_count: 6,
            corner:0,
            animation:{
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
            }
        },     
        tags:["rotatable"]  
    },
    {
        name: "fast-transport-belt",
        type: "transport-belt",
        menu_type: Data.menu_types[0],
        grid_size:new Point(1,1),
        animation:{
            file_name: "images\\entity\\fast-transport-belt\\fast-transport-belt.png",
            width:40,
            height:40,
            ticks_per_frame: -2, //Negative means it goes 2 frames every tick
            frame_count:32,
        },
        transport_belt: {
            direction: 0,
            direction_count: 6,
            corner:0,
            animation:{
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
            }
        },     
        tags:["rotatable"]  
    },
    {
        name: "express-transport-belt",
        type: "transport-belt",
        menu_type: Data.menu_types[0],
        grid_size:new Point(1,1),
        animation:{
            file_name: "images\\entity\\express-transport-belt\\express-transport-belt.png",
            width:40,
            height:40,
            ticks_per_frame: -3, //Negative means it goes 2 frames every tick
            frame_count:32,
        },
        transport_belt: {
            direction: 0,
            direction_count: 6,
            corner:0,
            animation:{
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
            }
        },     
        tags:["rotatable"]  
    },


    {
        name: "assembling-machine-1",
        type: "assembling-machine",
        menu_type: Data.menu_types[1],
        grid_size:new Point(3,3),
        animation:{
            file_name: "images\\entity\\assembling-machine-1\\assembling-machine-1.png",
            width:108,
            height:119,
            ticks_per_frame: 1, //Negative means it goes 2 frames every tick
            frame_count:32,
            line_length: 8,
            shift: {
                y: -5,
                x: 0
            }
        }, 
        tags:["rotatable"]  
    },
]
/*let DATA = {
    menu_types:[
   
    ],
    entities: [
        {
            name: "transport-belt",
            type: "transport-belt",
            menu_type: "transport-belts",
            direction: 1,
            animations:{
                filename,
                width:40,
                height:40,
                frame_count: 16,
                
                
            },
            
        },
        {
            name: "express-transport-belt",
        }
    ]
}*/
// Belt Directions:
// --> 2
// V   4
// <-- 6
// ^   0?
// corners:
// 0 if none
// 1 for top right,
// 2 for bottom right etc


let belt_test_blueprint = "0eNqV0ckKwjAQBuB3+c8p2LRUzKuISJdBAu0kJFFaSt7dLh4EA9LjbB/DzIymf5J1mgPUDN0a9lDXGV4/uO7XXJgsQUEHGiDA9bBGNFpH3mfB1eytcSFrqA+IApo7GqHyeBMgDjpo2sUtmO78HBpyS8M/S8Aav4wbXrdYyKwQmKBOMYofTR7X8o8m0GlH7V6SCbs4bCfpMkGXh+kiRVfrsbcHqa9/CrzI+b2hLGVVnWUuLzG+ARDGqi4=";
let belt_test2 = "0eNqd018LwiAQAPDvcs8O0q1VfpWI2OoIYbuJumgMv3uu9dAfo+xJTs+fx+GNUDc9aqPIgRxBHTqyILcjWHWiqpn23KARJCiHLTCgqp0ivGiD1mbOVGR1Z1xWY+PAM1B0xAtI7ncMkJxyCmfxFgx76tsaTUj4ZjHQnQ3XO5qqCGSWMxjCwsMrR2XwMJ8Jz95w8S++8BEtT9YWd+yp0CJCF+mF8pgda8Iy2Rafe1AmY/zXHqyS6TxGlxF6/WfV/JUOn/k2APJhXhic0dg5oShEWa4EFxvvr9ThIk4="


export{
    Data,
    Entity
}


