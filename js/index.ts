import * as pako from "pako"
import {Point} from "./Utils"
import {DrawHelper} from "./DrawHelper"
import {InputManager} from "./InputManager"
import {KeyBindings} from "./InputManager"
import {Data, Entity} from "./Entity"
import {Grid} from "./Grid"

export const COLOR_SCHEME = {
    background: "#282c34",
    borders: "#4f5052",
    crosshair: "#e0e0e0",
};
export const OPTIONS = {
    GRID_SIZE: 40,
    ENTITY_SCALEUP: 10,
    SQUARES_WIDE: 100,
    SQUARES_HIGH: 100,
    BORDER_WIDTH: 4,
    FONT_SIZE: 25,
    CAMERA_MOVE_SPEED: 10,
    CURRENT_SELECTED_ITEM_OPACITY: .5
}

enum LINE_SNAP{
    None,
    Vertical,
    Horizontal,
}

export class Editor{
    /*static readonly GRID_SIZE = 40;
    static readonly ENTITY_SCALEUP = 10;
    static readonly SQUARES_WIDE = 100;
    static readonly SQUARES_HIGH = 100;
    static readonly BORDER_WIDTH = 4;
    static readonly FONT_SIZE = 25;
    static readonly CAMERA_MOVE_SPEED = 10;
    static readonly CURRENT_SELECTED_ITEM_OPACITY = .5;*/

    private static _canvas: HTMLCanvasElement;
    private static _ctx: CanvasRenderingContext2D;

    private static _menu: HTMLDivElement;
    private static _menu_button: HTMLDivElement;
    private static _import_button: HTMLDivElement;
    private static _export_button: HTMLDivElement;


    private static _last_mouse_grid_position: Point = new Point(0,0);
    private static _mouse_grid_position: Point = new Point(0,0);
    static get mouse_grid_position(): Point{
        return this._mouse_grid_position;
    }


    private static _current_selected_item: Entity;

    private static _line_snap_type: LINE_SNAP;

    private static _unused_ids: number[] = [];
    private static _entities: Entity[] = [];
    private static _global_animators: Animator[] = [];

    private static _grid: Grid;
    
    
    static grid: number[][];
    
    static Init(){      
        this._canvas = document.getElementById("editorCanvas") as HTMLCanvasElement;
        this._ctx = this._canvas.getContext("2d");

        this._menu_button = document.getElementById("menuButton") as HTMLDivElement;
        this._menu_button.onclick = function(){
            Editor.ToggleMenu();
        }
        //Setup any styling
        this._canvas.style.backgroundColor=COLOR_SCHEME.background;

        this._canvas.oncontextmenu = function (e) {
            e.preventDefault();
        };
        this._canvas.onclick = function(){
            Editor.CloseMenu();
        }

        //test
        var test = "0eNqV0ckKwjAQBuB3+c8p2LRUzKuISJdBAu0kJFFaSt7dLh4EA9LjbB/DzIymf5J1mgPUDN0a9lDXGV4/uO7XXJgsQUEHGiDA9bBGNFpH3mfB1eytcSFrqA+IApo7GqHyeBMgDjpo2sUtmO78HBpyS8M/S8Aav4wbXrdYyKwQmKBOMYofTR7X8o8m0GlH7V6SCbs4bCfpMkGXh+kiRVfrsbcHqa9/CrzI+b2hLGVVnWUuLzG+ARDGqi4=";
        this.LoadBlueprint(test);

        InputManager.AddKeyEvent(false, KeyBindings.DropItem, ()=>{
            this._current_selected_item = undefined;
        });
        InputManager.AddKeyEvent(false, KeyBindings.Rotate, ()=>{
            if(this._current_selected_item){
                this._current_selected_item.Rotate();
            }
        });
        
        this._grid = new Grid(
            OPTIONS.GRID_SIZE, 
            new Point(this._canvas.width, this._canvas.height),
            OPTIONS.BORDER_WIDTH,
            COLOR_SCHEME.borders,
            COLOR_SCHEME.crosshair,
            COLOR_SCHEME.background,
            OPTIONS.FONT_SIZE
        )


        this.CreateMenu();
        this.CreateGrid();
        this.Resize();

        Data.LoadImages();
    }
    static Update(){
     
        //Handle line snap
        if(InputManager.IsKeyDown(KeyBindings.LineSnap)){
            if(this._line_snap_type == LINE_SNAP.None){
                let diff = this._mouse_grid_position.SubtractC(this._last_mouse_grid_position);
                if(diff.x != 0){
                    this._line_snap_type = LINE_SNAP.Horizontal;
                }
                if(diff.y != 0){
                    this._line_snap_type = LINE_SNAP.Vertical
                }
            }
        }
        else{
            this._line_snap_type = LINE_SNAP.None;
        }
        
        this._last_mouse_grid_position = this._mouse_grid_position.Copy();
        this._mouse_grid_position = this.ScreenToGridCoords(InputManager.mouse_position);
        this._mouse_grid_position.Clamp(
            {x: 1, y: 1},
            {x: OPTIONS.SQUARES_WIDE, y: OPTIONS.SQUARES_HIGH}
        )

        if(this._line_snap_type == LINE_SNAP.Horizontal){
            this._mouse_grid_position.y = this._last_mouse_grid_position.y;
        }
        else if(this._line_snap_type == LINE_SNAP.Vertical){
            this._mouse_grid_position.x = this._last_mouse_grid_position.x;
        }



        DrawHelper.ClearScreen(this._ctx);

    
        //Handle Camera Movement
        if(InputManager.IsKeyDown(KeyBindings.MoveRight)){
            DrawHelper.camera_position.Add({x: OPTIONS.CAMERA_MOVE_SPEED, y:0});
        }
        else if(InputManager.IsKeyDown(KeyBindings.MoveLeft)){
            DrawHelper.camera_position.Add({x: -OPTIONS.CAMERA_MOVE_SPEED, y:0});
        }

        if(InputManager.IsKeyDown(KeyBindings.MoveDown)){
            DrawHelper.camera_position.Add({x: 0, y: OPTIONS.CAMERA_MOVE_SPEED});
        }
        else if(InputManager.IsKeyDown(KeyBindings.MoveUp)){
            DrawHelper.camera_position.Add({x: 0, y: -OPTIONS.CAMERA_MOVE_SPEED});
        }

        DrawHelper.camera_position.Clamp(
            { x: 0, y: 0},
            {
                x: OPTIONS.GRID_SIZE*OPTIONS.SQUARES_WIDE - this._canvas.width,
                y: OPTIONS.GRID_SIZE*OPTIONS.SQUARES_HIGH - this._canvas.height  
            }
        )

        //Handle Placement
        if(this._current_selected_item && InputManager.IsMouseDown(0)){
            this.TryPlace();
        }
        if(InputManager.IsMouseDown(2)){
            this.TryRemove();
        }
        if(InputManager.IsMouseDown(1)){
            console.log(this.grid);
            console.log(this._entities);
            console.log(this._unused_ids);
        }
    
        this._grid.DrawCrosshairs(this._ctx);
        this.DrawGrid();

        for(let key in this._global_animators){
            let animator = this._global_animators[key];
            animator.Update();
        }

        for(let entity of this._entities){
            if(entity){
                entity.Draw(this._ctx, 1);
            }
        }

        if(this._current_selected_item){
            this._current_selected_item.position = this._mouse_grid_position.Copy();
            this._current_selected_item.Draw(this._ctx, OPTIONS.CURRENT_SELECTED_ITEM_OPACITY);
        }

        this._grid.DrawRulers(this._ctx);
    }



    static TryRemove(){
        
        if(this.grid[this._mouse_grid_position.x][this._mouse_grid_position.y] !== undefined){
            let id = this.grid[this._mouse_grid_position.x][this._mouse_grid_position.y];
            
            let entity = this._entities.filter((value)=>{
                if(value){
                    return value.id == id;
                }
            })[0];

            let index = this._entities.indexOf(entity);
            if(index > -1){
                this._entities[index] = undefined;
                console.log("Removed entity: "+entity.id);
            }

            for(var i = 0; i<this.grid.length; i++){
                for(var x = 0; x<this.grid[i].length; x++){
                    if(this.grid[i][x] == id){
                        this.grid[i][x] = undefined;
                    }
                }
            }
            this._unused_ids.push(id);
            console.log(entity);
        }

    }
    static IsClear(){
        let result = {
            SameType: true,
            Empty: true,
        }
        for(let x = 0; x<this._current_selected_item.properties.grid_size.x; x++){
            for(let y = 0; y<this._current_selected_item.properties.grid_size.y; y++){
                if(this.grid[this._mouse_grid_position.x+x][this._mouse_grid_position.y+y] != undefined){
                    result.Empty = false;

                    let id = this.grid[this._mouse_grid_position.x+x][this._mouse_grid_position.y+y];
                    let entity: Entity = this._entities.filter((value)=>{
                        if(value){
                            return value.id == id;
                        }
                    })[0];

                    console.log(entity.properties.type);
                    if(entity.properties.type != this._current_selected_item.properties.type){
                        result.SameType = false;
                    }
                   // console.log(entity.position)
                    if(!entity.position.Equals(this._current_selected_item.position)){
                        result.SameType = false;
                    }

                    if(entity.properties.grid_size.x != entity.properties.grid_size.y){
                        result.SameType = false;
                    }
                    //Prevent placing over the exact same block
                    //console.log("direction",entity.GetDirection(), this.current_selected_item.GetDirection())
                    if(entity.GetDirection() == this._current_selected_item.GetDirection() &&
                       entity.properties.name == this._current_selected_item.properties.name){
                        result.SameType = false;
                    }
                }
            }
        }
        return result;
    }
    static TryPlace(){

        if(this._menu.classList.contains("open")) return;
       // console.log("Trying place at "+ this.mouse_grid_position.x);
       // console.log(this.grid[this.mouse_grid_position.x][this.mouse_grid_position.y]);
        let is_clear = this.IsClear();
        if(is_clear.Empty){            
            console.log("-Space is empty");

            for(let x = 0; x<this._current_selected_item.properties.grid_size.x; x++){
                for(let y = 0; y<this._current_selected_item.properties.grid_size.y; y++){
               //     console.log("Placing element with id: "+this.current_selected_item.id);
                    
                    this.grid[this._mouse_grid_position.x+x][this._mouse_grid_position.y+y] = this._current_selected_item.id;
                    
                 //   console.log("Grid at spot now looks like "+this.grid)
                }
            }
            this._current_selected_item.position = this._mouse_grid_position;
            this._entities[this._current_selected_item.id] = this._current_selected_item;
            
            let entity_name = this._current_selected_item.properties.name;
            let direction = this._current_selected_item.GetDirection();

           
            let grid_size = {
                 x: this._current_selected_item.properties.grid_size.x,
                 y: this._current_selected_item.properties.grid_size.y
            }
            this._current_selected_item = new Entity(this.GetNextID(), this._mouse_grid_position.Copy());
            this._current_selected_item.LoadFromData(entity_name);
            this._current_selected_item.SetDirection(direction);
            this._current_selected_item.properties.grid_size = new Point(grid_size.x, grid_size.y);
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
    static SelectItem(value: string){
        let id = this.GetNextID();
        let new_entity = new Entity(id, this._mouse_grid_position);
        new_entity.LoadFromData(value);

        this._current_selected_item = new_entity; 
    }



/*

    static DrawCrosshairs(){
        let crosshair_pos: Point = this._mouse_grid_position.ScaleC(OPTIONS.GRID_SIZE);
    
        //Horizontal
        DrawHelper.DrawRect(
            this._ctx,
            new Point(
                DrawHelper.camera_position.x,
                crosshair_pos.y
            ),
            new Point(
                DrawHelper.camera_position.x + this._canvas.width,
                OPTIONS.GRID_SIZE
            ),
            {
                color:COLOR_SCHEME.crosshair
            }
        );

        //Vertical
        DrawHelper.DrawRect(
            this._ctx,
            new Point(
                crosshair_pos.x,
                DrawHelper.camera_position.y,
            ),
            new Point(
                OPTIONS.GRID_SIZE,
                DrawHelper.camera_position.y + this._canvas.height,
            ),
            {
                color:COLOR_SCHEME.crosshair
            }
        );
    }*/

    static GetNextID(): number{
        let id = (this._unused_ids.length > 0)?this._unused_ids.pop():this._entities.length;   
        console.log("Assigning ID: "+id);
        return id; 
    }
    static CreateGrid(){
        this.grid = [];
        for(let i = 0; i<OPTIONS.SQUARES_WIDE; i++){
            this.grid[i] = [];
        }
    }
    static DrawGrid(){
        //Vertical Lines
        for(let x = 1; x<OPTIONS.SQUARES_WIDE; x++){
            let x_pos = x*OPTIONS.GRID_SIZE;

            //Draw Lines
            DrawHelper.DrawLine(
                this._ctx, 
                new Point(x_pos, 0),
                new Point(x_pos, OPTIONS.GRID_SIZE*OPTIONS.SQUARES_HIGH),
                {
                    line_width: OPTIONS.BORDER_WIDTH,
                    color: COLOR_SCHEME.borders
                }
            );
        }
        //Horizontal Lines
        for(let y = 1; y<OPTIONS.SQUARES_HIGH; y++){
            let y_pos = y*OPTIONS.GRID_SIZE;


            DrawHelper.DrawLine(
                this._ctx, 
                new Point(0, y_pos),
                new Point(OPTIONS.GRID_SIZE*OPTIONS.SQUARES_WIDE, y_pos),
                {
                    line_width: OPTIONS.BORDER_WIDTH,
                    color: COLOR_SCHEME.borders
                }
            );
        }
    } 
    
    /*
    static DrawRulers(){
        let text_centering_factor = (OPTIONS.GRID_SIZE - OPTIONS.FONT_SIZE)/2;
        
        DrawHelper.DrawRect(
            this._ctx,
            new Point(DrawHelper.camera_position.x,DrawHelper.camera_position.y),
            new Point(this._canvas.width, OPTIONS.GRID_SIZE),
            {
                color:COLOR_SCHEME.background
            }
        )
        DrawHelper.DrawRect(
            this._ctx,
            new Point(DrawHelper.camera_position.x,DrawHelper.camera_position.y),
            new Point(OPTIONS.GRID_SIZE, this._canvas.height),
            {
                color:COLOR_SCHEME.background
            }
        )
        //Draw Numbers horizontal
        for(let x = 1; x<OPTIONS.SQUARES_WIDE; x++){
            let x_pos = x*OPTIONS.GRID_SIZE;
    

            DrawHelper.DrawText(
                this._ctx, 
                new Point(
                    x_pos+text_centering_factor, 
                    OPTIONS.FONT_SIZE+text_centering_factor - 5 + DrawHelper.camera_position.y
                ),
                ("0"+x).slice(-2),
                {
                    color: COLOR_SCHEME.borders,
                    font: "700 "+OPTIONS.FONT_SIZE+"px Share Tech Mono"
                }
            );
            DrawHelper.DrawLine(
                this._ctx,
                new Point(x_pos+OPTIONS.GRID_SIZE, DrawHelper.camera_position.y),
                new Point(x_pos+OPTIONS.GRID_SIZE, DrawHelper.camera_position.y + OPTIONS.GRID_SIZE),
                {
                    color: COLOR_SCHEME.borders,
                    line_width: OPTIONS.BORDER_WIDTH
                }
            )
            
        }


        //Draw Numbers vertical
        for(let y = 1; y<OPTIONS.SQUARES_HIGH; y++){
            let y_pos = y*OPTIONS.GRID_SIZE;

            DrawHelper.DrawText(
                this._ctx, 
                new Point(
                    text_centering_factor + DrawHelper.camera_position.x, 
                    y_pos+OPTIONS.FONT_SIZE+text_centering_factor - 5
                ),
                ("0"+y).slice(-2),
                {
                    color: COLOR_SCHEME.borders,
                    font: "700 "+OPTIONS.FONT_SIZE+"px Share Tech Mono"
                }
            );
            DrawHelper.DrawLine(
                this._ctx,
                new Point(DrawHelper.camera_position.x, y_pos+OPTIONS.GRID_SIZE),
                new Point(DrawHelper.camera_position.x + OPTIONS.GRID_SIZE, y_pos+OPTIONS.GRID_SIZE),
                {
                    color: COLOR_SCHEME.borders,
                    line_width: OPTIONS.BORDER_WIDTH
                }
            )
        }

        //Little square in top left to hide overlapping numbers
        DrawHelper.DrawRect(
            this._ctx,
            new Point(DrawHelper.camera_position.x,DrawHelper.camera_position.y),
            new Point(OPTIONS.GRID_SIZE, OPTIONS.GRID_SIZE),
            {
                color:COLOR_SCHEME.background
            }
        )

        //Bottom border below numbers
        DrawHelper.DrawLine(
            this._ctx,
            new Point(DrawHelper.camera_position.x, DrawHelper.camera_position.y+OPTIONS.GRID_SIZE),
            new Point(DrawHelper.camera_position.x+this._canvas.width, DrawHelper.camera_position.y+OPTIONS.GRID_SIZE),
            {
                color:COLOR_SCHEME.borders,
                line_width: OPTIONS.BORDER_WIDTH
            }
        )
        //Right border to the right of numbers
        DrawHelper.DrawLine(
            this._ctx,
            new Point(DrawHelper.camera_position.x+OPTIONS.GRID_SIZE, DrawHelper.camera_position.y),
            new Point(DrawHelper.camera_position.x+OPTIONS.GRID_SIZE, DrawHelper.camera_position.y+this._canvas.height),
            {
                color:COLOR_SCHEME.borders,
                line_width: OPTIONS.BORDER_WIDTH
            }
        )
    } 
*/



    static CreateMenu(){
        let accent_counter = 1;//Fancy tree colors

        InputManager.AddKeyEvent(false, KeyBindings.ToggleMenu, function(){
            Editor.ToggleMenu();
        })
        this._menu = document.getElementById("menu") as HTMLDivElement;
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
            this._menu.appendChild(new_link);
            this._menu.appendChild(new_ul);
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
    static ToggleMenu(){
        if(this._menu.classList.contains("open")){
            this.CloseMenu();   
        }
        else{
            this._menu.classList.add("open");
        }
    }
    static CloseMenu(){
        this._menu.classList.remove("open");
    }



    static Resize(){
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
        this._canvas.style.height = window.innerHeight+"px";
        this._canvas.style.width = window.innerWidth+"px";
    }


    static ScreenToCameraCoords(p: Point): Point{
        return p.AddC(DrawHelper.camera_position);
    }
    static CameraToGridCoords(p: Point): Point{
        return new Point(
            Math.round(p.x / OPTIONS.GRID_SIZE - .5),
            Math.round(p.y / OPTIONS.GRID_SIZE - .5)
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
