import {Properties, AnimationProperties} from "./Entity"


export class Data{

    static loaded_images: HTMLImageElement[] = [];
    static menu_types:string[] = [];
    static entities: Properties[] = [];

    static LoadImages(){

        for(let entity of this.entities){
            if(entity.animations){
                //console.log(entity.animations);
                for(let anim_key in entity.animations){
                    let anim = entity.animations[anim_key];
                    if(!this.loaded_images[anim.file_name]){
                        let new_image = new Image();
                        new_image.src = anim.file_name;
                        this.loaded_images[anim.file_name] = new_image;
                    }
                // console.log(anim);
                }
            }
            
        }
        console.log(this.entities);
    }
}
Data.menu_types = [
    "transport-belts",
]

Data.entities = []



/****************************/
/*      Transport Belts     */
/****************************/


let belt_animations_default = {
        width: 40,
        height: 40,
        ticks_per_frame: 0,
        frame_count: 16,
};
let basic_belt_default = {
    ...belt_animations_default,
    file_name: "images\\entity\\transport-belt\\transport-belt.png"
};
let fast_belt_default = {
    ...belt_animations_default,
    ticks_per_frame: -2,
    frame_count: 32,
    file_name: "images\\entity\\fast-transport-belt\\fast-transport-belt.png"
}
let express_belt_default = {
    ...belt_animations_default,
    ticks_per_frame: -3,
    frame_count: 32,
    file_name: "images\\entity\\express-transport-belt\\express-transport-belt.png"
}
let belt_directions = {
    current_direction: 0,
    direction_count: 4,
    0:{
        animation: "default"
    },
    1:{
        animation: "down"
    },
    2:{
        animation: "left"
    },
    3:{
        animation: "up"
    },
}


//basic-tranport-belt
Data.entities.push({
    name: "transport-belt",
    type: "transport-belt",
    menu_type: "transport-belts",
    grid_size:{
        x: 1,
        y: 1
    },
    animations:{
        default:{
            ...basic_belt_default,
        },
        down:{
            ...basic_belt_default,
            source_shift:{
                y:40,
                x:0
            },
            mirror:{
                x:false,
                y:true
            }
        },
        left:{
            ...basic_belt_default,
            mirror:{
                x:true,
                y:false
            }
        },
        up:{
            ...basic_belt_default,
            source_shift:{
                y:40,
                x:0
            },
        }
    },
    directions:{
        ...belt_directions
    },
    tags:["rotatable"],
});

//fast-transport-belt
Data.entities.push({
    name: "fast-transport-belt",
    type: "transport-belt",
    menu_type: "transport-belts",
    grid_size:{
        x: 1,
        y: 1
    },
    animations:{
        default:{
            ...fast_belt_default,
        },
        down:{
            ...fast_belt_default,
            source_shift:{
                y:40,
                x:0
            },
            mirror:{
                x:false,
                y:true
            }
        },
        left:{
            ...fast_belt_default,
            mirror:{
                x:true,
                y:false
            }
        },
        up:{
            ...fast_belt_default,
            source_shift:{
                y:40,
                x:0
            },
        }
    },
    directions:{
        ...belt_directions
    },
    tags:["rotatable"],
});

//express-transport-belt
Data.entities.push({
    name: "express-transport-belt",
    type: "transport-belt",
    menu_type: "transport-belts",
    grid_size:{
        x: 1,
        y: 1
    },
    animations:{
        default:{
            ...express_belt_default,
        },
        down:{
            ...express_belt_default,
            source_shift:{
                y:40,
                x:0
            },
            mirror:{
                x:false,
                y:true
            }
        },
        left:{
            ...express_belt_default,
            mirror:{
                x:true,
                y:false
            }
        },
        up:{
            ...express_belt_default,
            source_shift:{
                y:40,
                x:0
            },
        }
    },
    directions:{
        ...belt_directions
    },
    tags:["rotatable"],
});







/****************************/
/*        Splitters         */
/****************************/

let splitter_animation_defaults = {
    ticks_per_frame: 0,
    frame_count: 32,
    line_length: 16,
}
let splitter_directions = {
    current_direction: 0,
    direction_count: 4,
    0:{
        animation: "default"
    },
    1:{
        animation: "down"
    },
    2:{
        animation: "left"
    },
    3:{
        animation: "up"
    },
}


//basic splitter
Data.entities.push({
    name:"splitter",
    type:"splitter",
    menu_type:"transport-belts",
    grid_size:{
        x:1,
        y:2
    },
    animations:{
        default:{
            ...splitter_animation_defaults,
            file_name: "images\\entity\\splitter\\splitter-east.png",
            width: 51,
            height: 80,
            destination_shift:{
                x: 0,
                y:-4
            },
            destination_dimensions:{
                width:1.3,
                height:2
            },
        },
        down:{
            ...splitter_animation_defaults,
            file_name: "images\\entity\\splitter\\splitter-south.png",
            width: 85,
            height: 35,
            destination_shift:{
                x: 0,
                y:-5
            },
            destination_dimensions:{
                width:2.2,
                height:1.1
            }
        },
        left:{
            ...splitter_animation_defaults,
            file_name: "images\\entity\\splitter\\splitter-west.png",
            width: 51,
            height: 78,
            destination_shift:{
                x: 2,
                y:-4
            },
            destination_dimensions:{
                width:1.3,
                height:2
            }
        },
        up:{
            ...splitter_animation_defaults,
            file_name: "images\\entity\\splitter\\splitter-north.png",
            width: 83,
            height: 36,
            destination_shift:{
                x: 5,
                y:0
            },
            destination_dimensions:{
                width:2.2,
                height:1
            }
        }
    },
    directions:{
        ...splitter_directions
    },
    children:[
        {
            name:"transport-belt"
        },
        {
            name:"transport-belt",
            offset:{
                x:0,
                y:1
            }
        }
    ],
    tags:["rotatable"]
});