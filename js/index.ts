import * as pako from "pako"
import {Point} from "./Utils"
import {DrawHelper} from "./DrawHelper"
import {InputManager} from "./InputManager"
import {KeyBindings} from "./InputManager"
import {Data, Entity} from "./Entity"

const COLOR_SCHEME = {
    background: "#282c34",
    borders: "#4f5052",
    crosshair: "#e0e0e0",
};

enum LINE_SNAP{
    None,
    Vertical,
    Horizontal,
}

export class Editor{
    static readonly GRID_SIZE = 40;
    static readonly ENTITY_SCALEUP = 10;
    static readonly SQUARES_WIDE = 100;
    static readonly SQUARES_HIGH = 100;
    static readonly BORDER_WIDTH = 4;
    static readonly FONT_SIZE = 25;
    static readonly CAMERA_MOVE_SPEED = 10;
    static readonly CURRENT_SELECTED_ITEM_OPACITY = .5;

    private static canvas: HTMLCanvasElement;
    private static ctx: CanvasRenderingContext2D;

    private static menu: HTMLDivElement;
    private static menu_button: HTMLDivElement;
    private static import_button: HTMLDivElement;
    private static export_button: HTMLDivElement;


    static last_mouse_grid_position: Point = new Point(0,0);
    static mouse_grid_position: Point = new Point(0,0);

    static current_selected_item: Entity;

    static line_snap_type: LINE_SNAP;

    static unused_ids: number[] = [];
    static entities: Entity[] = [];
    static global_animators: Animator[] = [];

    
    static grid: number[][];
    
    static Init = function(){      
        this.canvas = document.getElementById("editorCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.menu_button = document.getElementById("menuButton");
        this.menu_button.onclick = function(){
            Editor.ToggleMenu();
        }
        //Setup any styling
        this.canvas.style.backgroundColor=COLOR_SCHEME.background;

        this.canvas.oncontextmenu = function (e) {
            e.preventDefault();
        };
        this.canvas.onclick = function(){
            Editor.CloseMenu();
        }

        //test
        var test = "0eNqV0ckKwjAQBuB3+c8p2LRUzKuISJdBAu0kJFFaSt7dLh4EA9LjbB/DzIymf5J1mgPUDN0a9lDXGV4/uO7XXJgsQUEHGiDA9bBGNFpH3mfB1eytcSFrqA+IApo7GqHyeBMgDjpo2sUtmO78HBpyS8M/S8Aav4wbXrdYyKwQmKBOMYofTR7X8o8m0GlH7V6SCbs4bCfpMkGXh+kiRVfrsbcHqa9/CrzI+b2hLGVVnWUuLzG+ARDGqi4=";
        this.LoadBlueprint(test);

        InputManager.AddKeyEvent(false, KeyBindings.DropItem, ()=>{
            this.current_selected_item = undefined;
        });
        InputManager.AddKeyEvent(false, KeyBindings.Rotate, ()=>{
            if(this.current_selected_item){
                this.current_selected_item.Rotate();
            }
        });
        
        this.CreateMenu();
        this.CreateGrid();
        this.Resize();

        Data.LoadImages();
    }
    static Update = function(){
     
        //Handle line snap
        if(InputManager.IsKeyDown(KeyBindings.LineSnap)){
            if(this.line_snap_type == LINE_SNAP.None){
                let diff = this.mouse_grid_position.SubtractC(this.last_mouse_grid_position);
                if(diff.x != 0){
                    this.line_snap_type = LINE_SNAP.Horizontal;
                }
                if(diff.y != 0){
                    this.line_snap_type = LINE_SNAP.Vertical
                }
            }
        }
        else{
            this.line_snap_type = LINE_SNAP.None;
        }
        
        this.last_mouse_grid_position = this.mouse_grid_position.Copy();
        this.mouse_grid_position = this.ScreenToGridCoords(InputManager.mouse_position);
        this.mouse_grid_position.Clamp(
            {x: 1, y: 1},
            {x: this.SQUARES_WIDE, y: this.SQUARES_HIGH}
        )

        if(this.line_snap_type == LINE_SNAP.Horizontal){
            this.mouse_grid_position.y = this.last_mouse_grid_position.y;
        }
        else if(this.line_snap_type == LINE_SNAP.Vertical){
            this.mouse_grid_position.x = this.last_mouse_grid_position.x;
        }



        DrawHelper.ClearScreen(this.ctx);

    
        //Handle Camera Movement
        if(InputManager.IsKeyDown(KeyBindings.MoveRight)){
            DrawHelper.camera_position.Add({x: this.CAMERA_MOVE_SPEED, y:0});
        }
        else if(InputManager.IsKeyDown(KeyBindings.MoveLeft)){
            DrawHelper.camera_position.Add({x: -this.CAMERA_MOVE_SPEED, y:0});
        }

        if(InputManager.IsKeyDown(KeyBindings.MoveDown)){
            DrawHelper.camera_position.Add({x: 0, y: this.CAMERA_MOVE_SPEED});
        }
        else if(InputManager.IsKeyDown(KeyBindings.MoveUp)){
            DrawHelper.camera_position.Add({x: 0, y: -this.CAMERA_MOVE_SPEED});
        }

        DrawHelper.camera_position.Clamp(
            { x: 0, y: 0},
            {
                x: this.GRID_SIZE*this.SQUARES_WIDE - this.canvas.width,
                y: this.GRID_SIZE*this.SQUARES_HIGH - this.canvas.height  
            }
        )

        //Handle Placement
        if(this.current_selected_item && InputManager.IsMouseDown(0)){
            this.TryPlace();
        }
        if(InputManager.IsMouseDown(2)){
            this.TryRemove();
        }
        if(InputManager.IsMouseDown(1)){
            console.log(this.grid);
            console.log(this.entities);
            console.log(this.unused_ids);
        }
    
        this.DrawCrosshairs();
        this.DrawGrid();

        for(let key in this.global_animators){
            let animator = this.global_animators[key];
            animator.Update();
        }

        for(let entity of this.entities){
            if(entity){
                entity.Draw(this.ctx, 1);
            }
        }

        if(this.current_selected_item){
            this.current_selected_item.position = this.mouse_grid_position.Copy();
            this.current_selected_item.Draw(this.ctx, this.CURRENT_SELECTED_ITEM_OPACITY);
        }
        this.DrawRulers();
    }



    static TryRemove = function(){
        if(this.grid[this.mouse_grid_position.x][this.mouse_grid_position.y] !== undefined){
            let id = this.grid[this.mouse_grid_position.x][this.mouse_grid_position.y];
            
            let entity = this.entities.filter((value)=>{
                if(value){
                    return value.id == id;
                }
            })[0];

            let index = this.entities.indexOf(entity);
            if(index > -1){
                this.entities[index] = undefined;
                console.log("Removed entity: "+entity.id);
            }

            for(var i = 0; i<this.grid.length; i++){
                for(var x = 0; x<this.grid[i].length; x++){
                    if(this.grid[i][x] == id){
                        this.grid[i][x] = undefined;
                    }
                }
            }
            this.unused_ids.push(id);
            console.log(entity);
        }

    }
    static IsClear = function(){
        let result = {
            SameType: true,
            Empty: true,
        }
        for(let x = 0; x<this.current_selected_item.properties.grid_size.x; x++){
            for(let y = 0; y<this.current_selected_item.properties.grid_size.y; y++){
                if(this.grid[this.mouse_grid_position.x+x][this.mouse_grid_position.y+y] != undefined){
                    result.Empty = false;

                    let id = this.grid[this.mouse_grid_position.x+x][this.mouse_grid_position.y+y];
                    let entity: Entity = this.entities.filter((value)=>{
                        if(value){
                            return value.id == id;
                        }
                    })[0];

                    console.log(entity.properties.type);
                    if(entity.properties.type != this.current_selected_item.properties.type){
                        result.SameType = false;
                    }
                   // console.log(entity.position)
                    if(!entity.position.Equals(this.current_selected_item.position)){
                        result.SameType = false;
                    }

                    //Prevent placing over the exact same block
                    if(entity.GetDirection() == this.current_selected_item.GetDirection() &&
                       entity.properties.name == this.current_selected_item.properties.name){
                        result.SameType = false;
                    }
                }
            }
        }
        return result;
    }
    static TryPlace = function(){

        if(this.menu.classList.contains("open")) return;
       // console.log("Trying place at "+ this.mouse_grid_position.x);
       // console.log(this.grid[this.mouse_grid_position.x][this.mouse_grid_position.y]);
        let is_clear = this.IsClear();
        if(is_clear.Empty){            
            console.log("-Space is empty");

            for(let x = 0; x<this.current_selected_item.properties.grid_size.x; x++){
                for(let y = 0; y<this.current_selected_item.properties.grid_size.y; y++){
               //     console.log("Placing element with id: "+this.current_selected_item.id);
                    
                    this.grid[this.mouse_grid_position.x+x][this.mouse_grid_position.y+y] = this.current_selected_item.id;
                    
                 //   console.log("Grid at spot now looks like "+this.grid)
                }
            }
            this.current_selected_item.position = this.mouse_grid_position;
            this.entities[this.current_selected_item.id] = this.current_selected_item;
            
            let entity_name = this.current_selected_item.properties.name;
            let direction = this.current_selected_item.GetDirection();
            this.current_selected_item = new Entity(this.GetNextID(), this.mouse_grid_position.Copy());
            this.current_selected_item.LoadFromData(entity_name);
            this.current_selected_item.SetDirection(direction);
           // console.log("placed");   
           // console.log(this.grid);
        }
        else if(is_clear.SameType){
            console.log("same type");
            this.TryRemove();
            this.TryPlace();
        }
        else{
            console.log("-Space is FULL");
        }
        //console.log(this.current_selected_item);
    }
    static SelectItem = function(value: string){
        let id = this.GetNextID();
        let new_entity = new Entity(id, this.mouse_grid_position);
        new_entity.LoadFromData(value);

        this.current_selected_item = new_entity; 
    }





    static DrawCrosshairs = function(){
        let crosshair_pos: Point = this.mouse_grid_position.ScaleC(this.GRID_SIZE);
    
        //Horizontal
        DrawHelper.DrawRect(
            this.ctx,
            new Point(
                DrawHelper.camera_position.x,
                crosshair_pos.y
            ),
            new Point(
                DrawHelper.camera_position.x + this.canvas.width,
                this.GRID_SIZE
            ),
            {
                color:COLOR_SCHEME.crosshair
            }
        );

        //Vertical
        DrawHelper.DrawRect(
            this.ctx,
            new Point(
                crosshair_pos.x,
                DrawHelper.camera_position.y,
            ),
            new Point(
                this.GRID_SIZE,
                DrawHelper.camera_position.y + this.canvas.height,
            ),
            {
                color:COLOR_SCHEME.crosshair
            }
        );
    }
    static GetNextID = function(): number{
        let id = (this.unused_ids.length > 0)?this.unused_ids.pop():this.entities.length;   
        console.log("Assigning ID: "+id);
        return id; 
    }
    static CreateGrid = function(){
        this.grid = [];
        for(let i = 0; i<this.SQUARES_WIDE; i++){
            this.grid[i] = [];
        }
    }
    static DrawGrid = function(){
        //Vertical Lines
        for(let x = 1; x<this.SQUARES_WIDE; x++){
            let x_pos = x*this.GRID_SIZE;

            //Draw Lines
            DrawHelper.DrawLine(
                this.ctx, 
                new Point(x_pos, 0),
                new Point(x_pos, this.GRID_SIZE*this.SQUARES_HIGH),
                {
                    line_width: this.BORDER_WIDTH,
                    color: COLOR_SCHEME.borders
                }
            );
        }
        //Horizontal Lines
        for(let y = 1; y<this.SQUARES_HIGH; y++){
            let y_pos = y*this.GRID_SIZE;


            DrawHelper.DrawLine(
                this.ctx, 
                new Point(0, y_pos),
                new Point(this.GRID_SIZE*this.SQUARES_WIDE, y_pos),
                {
                    line_width: this.BORDER_WIDTH,
                    color: COLOR_SCHEME.borders
                }
            );
        }
    }   
    static DrawRulers(){
        let text_centering_factor = (this.GRID_SIZE - this.FONT_SIZE)/2;
        
        DrawHelper.DrawRect(
            this.ctx,
            new Point(DrawHelper.camera_position.x,DrawHelper.camera_position.y),
            new Point(this.canvas.width, this.GRID_SIZE),
            {
                color:COLOR_SCHEME.background
            }
        )
        DrawHelper.DrawRect(
            this.ctx,
            new Point(DrawHelper.camera_position.x,DrawHelper.camera_position.y),
            new Point(this.GRID_SIZE, this.canvas.height),
            {
                color:COLOR_SCHEME.background
            }
        )
        //Draw Numbers horizontal
        for(let x = 1; x<this.SQUARES_WIDE; x++){
            let x_pos = x*this.GRID_SIZE;
    

            DrawHelper.DrawText(
                this.ctx, 
                new Point(
                    x_pos+text_centering_factor, 
                    this.FONT_SIZE+text_centering_factor - 5 + DrawHelper.camera_position.y
                ),
                ("0"+x).slice(-2),
                {
                    color: COLOR_SCHEME.borders,
                    font: "700 "+this.FONT_SIZE+"px Share Tech Mono"
                }
            );
            DrawHelper.DrawLine(
                this.ctx,
                new Point(x_pos+this.GRID_SIZE, DrawHelper.camera_position.y),
                new Point(x_pos+this.GRID_SIZE, DrawHelper.camera_position.y + this.GRID_SIZE),
                {
                    color: COLOR_SCHEME.borders,
                    line_width: this.BORDER_WIDTH
                }
            )
            
        }


        //Draw Numbers vertical
        for(let y = 1; y<this.SQUARES_HIGH; y++){
            let y_pos = y*this.GRID_SIZE;

            DrawHelper.DrawText(
                this.ctx, 
                new Point(
                    text_centering_factor + DrawHelper.camera_position.x, 
                    y_pos+this.FONT_SIZE+text_centering_factor - 5
                ),
                ("0"+y).slice(-2),
                {
                    color: COLOR_SCHEME.borders,
                    font: "700 "+this.FONT_SIZE+"px Share Tech Mono"
                }
            );
            DrawHelper.DrawLine(
                this.ctx,
                new Point(DrawHelper.camera_position.x, y_pos+this.GRID_SIZE),
                new Point(DrawHelper.camera_position.x + this.GRID_SIZE, y_pos+this.GRID_SIZE),
                {
                    color: COLOR_SCHEME.borders,
                    line_width: this.BORDER_WIDTH
                }
            )
        }

        //Little square in top left to hide overlapping numbers
        DrawHelper.DrawRect(
            this.ctx,
            new Point(DrawHelper.camera_position.x,DrawHelper.camera_position.y),
            new Point(this.GRID_SIZE, this.GRID_SIZE),
            {
                color:COLOR_SCHEME.background
            }
        )

        //Bottom border below numbers
        DrawHelper.DrawLine(
            this.ctx,
            new Point(DrawHelper.camera_position.x, DrawHelper.camera_position.y+this.GRID_SIZE),
            new Point(DrawHelper.camera_position.x+this.canvas.width, DrawHelper.camera_position.y+this.GRID_SIZE),
            {
                color:COLOR_SCHEME.borders,
                line_width: this.BORDER_WIDTH
            }
        )
        //Right border to the right of numbers
        DrawHelper.DrawLine(
            this.ctx,
            new Point(DrawHelper.camera_position.x+this.GRID_SIZE, DrawHelper.camera_position.y),
            new Point(DrawHelper.camera_position.x+this.GRID_SIZE, DrawHelper.camera_position.y+this.canvas.height),
            {
                color:COLOR_SCHEME.borders,
                line_width: this.BORDER_WIDTH
            }
        )
    } 




    static CreateMenu = function(){
        let accent_counter = 1;//Fancy tree colors

        InputManager.AddKeyEvent(false, KeyBindings.ToggleMenu, function(){
            Editor.ToggleMenu();
        })
        this.menu = document.getElementById("menu");
        //create new ul for each menu type
        for(let type of Data.menu_types){
            let new_link = document.createElement("div");
            new_link.innerHTML = type.split("-").join(" ");

            let new_ul = document.createElement("ul");
            new_ul.id = type;

            //Fancy tree colors
            new_ul.classList.add("accent"+accent_counter);
            accent_counter++;

            new_link.onclick = function(){
                if(new_ul.classList.contains("open")){
                    new_ul.classList.remove("open");
                }
                else{
                    new_ul.classList.add("open");
                }
            }
            this.menu.appendChild(new_link);
            this.menu.appendChild(new_ul);
        }
    

        for(let entity of Data.entities){
            let new_li = document.createElement("li");
            new_li.innerHTML = "<span>"+entity.name+"</span>";
            let value = entity.name;
            new_li.onclick = ()=>{
                Editor.SelectItem(value);
            }
            document.getElementById(entity.menu_type).appendChild(new_li);
        }
    }
    static ToggleMenu = function(){
        if(this.menu.classList.contains("open")){
            this.CloseMenu();   
        }
        else{
            this.menu.classList.add("open");
        }
    }
    static CloseMenu = function(){
        this.menu.classList.remove("open");
    }



    static Resize = function(){
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.height = window.innerHeight+"px";
        this.canvas.style.width = window.innerWidth+"px";
    }


    static ScreenToCameraCoords(p: Point): Point{
        return p.AddC(DrawHelper.camera_position);
    }
    static CameraToGridCoords(p: Point): Point{
        return new Point(
            Math.round(p.x / this.GRID_SIZE - .5),
            Math.round(p.y / this.GRID_SIZE - .5)
        );
    }
    static ScreenToGridCoords(p: Point): Point{
        return this.CameraToGridCoords(this.ScreenToCameraCoords(p));
    }




    static DecodeString(b64: string): any{
        try{
            let str_data = atob(b64.substr(1));    
            let char_data = str_data.split('').map(function(x){return x.charCodeAt(0);});
            let bin_data = new Uint8Array(char_data);
            let data = pako.inflate(bin_data);
            let str = String.fromCharCode.apply(null, new Uint16Array(data));
            let json_data = JSON.parse(str);

            console.log(json_data);
            return json_data;
        }
        catch (e){
            console.log("Oops... tis borked");
        }
    }

    static LoadBlueprint(b64: string){
        let blueprint = this.DecodeString(b64).blueprint;

        for(let entity of blueprint.entities){
            console.log(entity);
        }
    }
}

export class Animator{
    private current_frame: number;
    private frame_count: number;
    private current_tick: number;
    private ticks_per_frame:number;

    constructor(frame_count:number, ticks_per_frame:number){
        this.current_frame = 0;
        this.frame_count = frame_count;
        this.current_tick = 0;
        this.ticks_per_frame = ticks_per_frame;
    }
    public Update(){
        if(this.current_tick < this.ticks_per_frame){
            this.current_tick++;
        }
        else{
            this.current_tick = 0;
            if(this.ticks_per_frame < 0){
                this.current_frame+=Math.abs(this.ticks_per_frame);
            }
            else{
                this.current_frame++;
            }
            if(this.current_frame >= this.frame_count){
                this.current_frame = 0;
            }
        }
    }
    public CurrentFrame(): number{
        return this.current_frame;
    }
}



window.onload = function(){
    Editor.Init();
    UpdateLoop();
}
window.onresize = function(){
    Editor.Resize();
}

function UpdateLoop(){

    //Do this so Editor can still use 'this' within the update function
    Editor.Update();
    window.requestAnimationFrame(UpdateLoop);
}
