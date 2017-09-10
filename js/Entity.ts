import {Point} from "./Utils"
import {Editor, Animator, OPTIONS} from "./index"
import {DrawHelper} from "./DrawHelper"
import {Data} from './Data';
/*
interface Properties{
    name: string,
    type: string,
    menu_type: string,
    grid_size: Point,
    animation?:AnimationProperties;
    pictures?:{
        file_name: string,
        width: number,
        height: number,
        direction_count: number,
        direction: number
    }
    transport_belt?: TransportBeltProperties;
    splitter?:SplitterProperties;
    control_behavior?: any;
    tags: string[];
}
interface AnimationProperties{
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
interface SplitterProperties{
    direction: number,
    direction_count: number,
    animation:{
        east:AnimationProperties,
        west: AnimationProperties,
        north: AnimationProperties,
        south: AnimationProperties,
    }
}*/

export interface Properties{
    name: string,
    type: string,
    menu_type: string,

    //Not using point so deep copy isn't necessary
    grid_size:{
        x: number,
        y: number,
    }
    animations?:{
        default: AnimationProperties,
        [key: string]: AnimationProperties,
    }
    directions?:{
        current_direction: number,
        direction_count: number,
        [key: number]:{
            animation?: string,
            picture?: string,
        }
    }
    children?:{
        name: string,
        entity?: Entity,
        offset?:{
            x: number,
            y: number,
        }
    }[],
    tags:string[],
}
export interface AnimationProperties{
    file_name: string,
    
    width: number,
    height: number,
    
    ticks_per_frame: number, //Negative means it goes that many frames every tick
    frame_count: number,
    line_length?: number,

    //The shift needed to move to a different
    //row or column on the spritesheet
    source_shift?:{
        x: number,
        y: number
    }
    //The deminsions that it will be drawn on the grid as
    //In grid units
    destination_dimensions?:{
        width: number,
        height: number
    },
    destination_shift?:{
        x: number,
        y: number
    },
    //the shifting of a sprite between frames
    //the assembling machines do this. If you look
    //at them on a grid you'll see this.
    sprite_shift?:{
        x: number,
        y: number
    },
    mirror?:{
        x: boolean,
        y: boolean
    }
}

class Entity{
    private _id: number;
    get id(): number{
        return this._id;
    }

    private _position: Point;
    get position(): Point{
        return this._position;
    }
    set position(value){
        this._position = value;

        if(this._properties.children){
            for(let i = 0; i<this._properties.children.length; i++){
                let child = this._properties.children[i];
                let new_value = value;
                if(child.offset){               
                    new_value = value.AddC(child.offset);
                }
                console.log(child);
                child.entity._position = new_value;
            }
        }
    }
    private _properties: Properties;
    get properties():Properties{
        return this._properties;
    }

    constructor(id:number, p: Point | {x: number, y:number}){
        this._id = id;
        this._position = new Point(p.x, p.y);
    }
    public LoadFromData(name: string){
        let data_entity = Data.entities.filter((value)=>{
            return value.name == name;
        })[0];

        //Seems like kinda a hack deep-copy but we'll see if its really that slow
        this._properties = JSON.parse(JSON.stringify(data_entity));    
        
        if(this._properties.animations){
            for(let anim_key in this._properties.animations){
                let anim = this._properties.animations[anim_key];
                if(!Editor.GetAnimator(this._properties.name+"-"+anim_key)){
                    Editor.AddAnimator( 
                        new Animator(
                            anim.frame_count,
                            anim.ticks_per_frame
                        ),
                        this._properties.name+"-"+anim_key
                    );
                }
            }
        }
        if(this._properties.children){
            for(let i = 0; i<this._properties.children.length; i++){
                let new_entity = new Entity(-1, this.position);
                new_entity.LoadFromData(this._properties.children[i].name);
                this._properties.children[i].entity = new_entity;
            }
        }
        //console.log(Editor.global_animators)
    }

    private DrawAnimation(ctx: CanvasRenderingContext2D, opacity: number, anim: AnimationProperties, anim_key: string){
        let image = Data.loaded_images[anim.file_name];

       // console.log("Current anim: "+anim_key);
        //Source image location on sprite-map
        let current_frame = Editor.GetAnimator(this._properties.name+"-"+anim_key).CurrentFrame();

        let s = new Point(
            anim.width * current_frame,
            0
        )
        if(anim.source_shift){
            s.Add(anim.source_shift);
        }

        //Source image dimensions
        let sD = new Point(
            anim.width,
            anim.height
        )
        
        //Destination dimensions
        let dD = new Point(this._properties.grid_size.x, this._properties.grid_size.y)
            .ScaleC(OPTIONS.GRID_SIZE)
            .AddC(
                {x: OPTIONS.ENTITY_SCALEUP, y: OPTIONS.ENTITY_SCALEUP}
            );

        //Destinationi position
        let d = this._position
            .ScaleC(OPTIONS.GRID_SIZE)
            .SubtractC(
                {x: OPTIONS.ENTITY_SCALEUP/2, y:OPTIONS.ENTITY_SCALEUP/2}
            );

        let mirrorX, mirrorY = false;
        
        if(anim.mirror){
            mirrorX = anim.mirror.x;
            mirrorY = anim.mirror.y;
        }
        let current_row = 0;
        let current_column = 0;
        if(anim.line_length){
            current_row = Math.floor(current_frame/anim.line_length);
            current_column = current_frame-(current_row * anim.line_length)
            s.y = current_row * anim.height;
            s.x = current_column * anim.width;
        }
        if(anim.sprite_shift){
            s.y += (current_row+1) * anim.sprite_shift.y;
            s.x += (current_column+1) * anim.sprite_shift.x;
        }
        if(anim.destination_shift){
            d.x += anim.destination_shift.x;
            d.y += anim.destination_shift.y;
        }
        if(anim.destination_dimensions){
            dD.x = anim.destination_dimensions.width * OPTIONS.GRID_SIZE;
            dD.y = anim.destination_dimensions.height * OPTIONS.GRID_SIZE;
            dD.Add(
                {x: OPTIONS.ENTITY_SCALEUP, y: OPTIONS.ENTITY_SCALEUP}
            );
           // console.log(dD);
        }

        DrawHelper.DrawImage(
            ctx,
            image,
            s,
            sD,
            d,
            dD,
            {
                opacity: opacity,
                flip_vertical: mirrorY,
                flip_horizontal: mirrorX,
            }
        )

    }
    public Draw(ctx: CanvasRenderingContext2D, opacity: number){
        
        if(this._properties.children){
            for(let i = 0; i<this._properties.children.length; i++){
                this._properties.children[i].entity.Draw(ctx, opacity);
            }
        }

        //Check to see if the multiple direction handling is required
        if(this._properties.directions){
            let current_direction = this._properties.directions[this._properties.directions.current_direction];
            
            if(current_direction.animation){
                let anim = this._properties.animations[current_direction.animation];
                this.DrawAnimation(ctx, opacity, anim, current_direction.animation);
            }
        }
    }
    public Rotate(){
        if(this._properties.tags.indexOf("rotatable") > -1){

            if(this._properties.children){
                for(let i = 0; i<this._properties.children.length; i++){
                    this._properties.children[i].entity.Rotate();
                }
            }

            this._properties.directions.current_direction++;
            if(this._properties.directions.current_direction >= this._properties.directions.direction_count){
                this._properties.directions.current_direction = 0;
            }

            //Gotta flip the grid size for oblong shapes
            if(this._properties.grid_size.x != this._properties.grid_size.y){
                let temp_x = this._properties.grid_size.x;
                this._properties.grid_size.x = this._properties.grid_size.y;
                this._properties.grid_size.y = temp_x;
                console.log("current grid size",this._properties.grid_size);
            }
            if(this._properties.children){
                for(let i = 0; i<this._properties.children.length; i++){
                    let child = this._properties.children[i];
                    if(child.offset){
                        let temp_x = child.offset.x;
                        child.offset.x = child.offset.y;
                        child.offset.y = temp_x;
                    }
                }
            }
        }
    }
    public GetDirection(): number{
        if(this._properties.directions){
            return this._properties.directions.current_direction;
        }
        return 0;
    }
    public SetDirection(dir: number){
        if(this._properties.directions){
            this._properties.directions.current_direction = dir; 
        }
        if(this._properties.children){
            for(let i = 0; i<this._properties.children.length; i++){
                this._properties.children[i].entity.SetDirection(dir);
            }
        }
    }
        /*if(this.properties.animation){

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
            let d = this.position
                .ScaleC(Editor.GRID_SIZE)
                .SubtractC(
                    {x:Editor.ENTITY_SCALEUP/2, y:Editor.ENTITY_SCALEUP/2}
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
                d,
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
        else if(this.properties.type == "electric-pole"){
            this.properties.pictures.direction++;
            if(this.properties.pictures.direction >= this.properties.pictures.direction_count){
                this.properties.pictures.direction = 0;
            }
        }*/
    
}


    /**********************/
    /*   Tranport Belts   */
    /**********************/
    /*
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
        name: "splitter",
        type: "splitter",
        menu_type: Data.menu_types[0],
        grid_size:new Point(1,1),
        animation:{
            file_name: "",
            width:40,
            height:40,
            ticks_per_frame: -3, //Negative means it goes 2 frames every tick
            frame_count:32,
        },
        splitter: {
            direction: 0,
            direction_count: 6,
            animation:{
                west:{
                    file_name: "images\\entity\\splitter\\splitter-west.png"
                    
                }
            }
        },     
        tags:["rotatable"]  
    },



    /***************************/
    /*   Assembling Machines   */
    /***************************/
/*
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
        tags:[]
    },
    {
        name: "assembling-machine-2",
        type: "assembling-machine",
        menu_type: Data.menu_types[1],
        grid_size:new Point(3,3),
        animation:{
            file_name: "images\\entity\\assembling-machine-2\\assembling-machine-2.png",
            width:108,
            height:110,
            ticks_per_frame: 1, //Negative means it goes 2 frames every tick
            frame_count:32,
            line_length: 8,
            shift:{
                y: 0,
                x: 0
            }
        }, 
        tags:[]
    },
    {
        name: "assembling-machine-3",
        type: "assembling-machine",
        menu_type: Data.menu_types[1],
        grid_size:new Point(3,3),
        animation:{
            file_name: "images\\entity\\assembling-machine-3\\assembling-machine-3.png",
            width:108,
            height:119,
            ticks_per_frame: 1, //Negative means it goes 2 frames every tick
            frame_count:32,
            line_length: 8,
            shift:{
                y: 0,
                x: 0
            }
        }, 
        tags:[]
    },


    /*******************/
    /*   Electricity   */
    /*******************/
    /*
    {
        name: "big-electric-pole",
        type: "electric-pole",
        menu_type: Data.menu_types[2],
        grid_size:new Point(2,2),
        pictures:{
            file_name: "images\\entity\\big-electric-pole\\big-electric-pole.png",
            width: 168,
            height: 165,
            direction_count: 4,
            direction: 1
        }, 
        tags:[]
    },

]*/



let new_data = {
    data: [
        {
            name: "transport-belt",
            type: "transport-belt",
            menu_type: "transport-belts",
            grid_size: {
                x: 10,
                y: 10,
            },
            animations:{
                default:{
                    file_name: "blah",
                    width: 100,
                    height: 100,

                    destination_dimensions:{
                        x: 1,
                        y: 1,
                    },
                    destination_shift:{

                    },
                    sprite_shift:{
                        x: 1,
                        y: 1,
                    }
                }
            },
            directions:{
                direction_count: 1,
                1:{
                    animation: "default",
                },
                2:{
                    pictures: "wowowo"
                }
            }
        },
    ]
}
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


