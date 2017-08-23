import * as pako from "pako"
import {Point} from "./Utils"
import {DrawHelper} from "./DrawHelper"
import {InputManager} from "./InputManager"
import {KeyBindings} from "./InputManager"

const COLOR_SCHEME = {
    background: "#282827",
    borders: "#3b3b3b",
    crosshair: "#e0e0e0",
};

enum LINE_SNAP{
    None,
    Vertical,
    Horizontal,
}

class Editor{
    private static GRID_SIZE = 40;
    private static SQUARES_WIDE = 100;
    private static SQUARES_HIGH = 100;
    private static BORDER_WIDTH = 4;
    private static FONT_SIZE = 25;
    private static CAMERA_MOVE_SPEED = 10;
    private static canvas: HTMLCanvasElement;
    private static ctx: CanvasRenderingContext2D;

    static last_mouse_grid_position: Point = new Point(0,0);
    static mouse_grid_position: Point = new Point(0,0);

    static line_snap_type: LINE_SNAP;

    static grid: number[][];
    
    static Init = function(){      
        this.canvas = document.getElementById("editorCanvas");
        this.ctx = this.canvas.getContext("2d");

        //Setup any styling
        this.canvas.style.backgroundColor=COLOR_SCHEME.background;

        //test
        var test = "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";

        this.LoadBlueprint(test);

        this.CreateGrid();
        this.Resize();
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
        

        this.DrawCrosshairs();
        this.DrawGrid();
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
    static CreateGrid = function(){
        this.grid = [];
        for(let i = 0; i<this.SQUARES_WIDE; i++){
            this.grid[i] = [];
        }
    }
    static DrawGrid = function(){
        let text_centering_factor = (this.GRID_SIZE - this.FONT_SIZE)/2;

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
        
            //Draw Numbers
            DrawHelper.DrawText(
                this.ctx, 
                new Point(x_pos+text_centering_factor, this.FONT_SIZE+text_centering_factor - 5),
                ("0"+x).slice(-2),
                {
                    color: COLOR_SCHEME.borders,
                    font: "700 "+this.FONT_SIZE+"px Share Tech Mono"
                }

            );
        }


        //Horizontal Lines
        for(let y = 1; y<this.SQUARES_HIGH; y++){
            let y_pos = y*this.GRID_SIZE;

            //Draw Lines
            DrawHelper.DrawLine(
                this.ctx, 
                new Point(0, y_pos),
                new Point(this.GRID_SIZE*this.SQUARES_WIDE, y_pos),
                {
                    line_width: this.BORDER_WIDTH,
                    color: COLOR_SCHEME.borders
                }
            );

            //Draw Numbers
            DrawHelper.DrawText(
                this.ctx, 
                new Point(text_centering_factor, y_pos+this.FONT_SIZE+text_centering_factor - 5),
                ("0"+y).slice(-2),
                {
                    color: COLOR_SCHEME.borders,
                    font: "700 "+this.FONT_SIZE+"px Share Tech Mono"
                }
            );
        }

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
