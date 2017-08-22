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
        

        //console.log(this.ScreenToGridCoords(InputManager.mouse_position));
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
        for(let x = 1; x<this.SQUARES_WIDE; x++){
            let x_pos = x*this.GRID_SIZE;

            DrawHelper.DrawLine(
                this.ctx, 
                new Point(x_pos, 0),
                new Point(x_pos, this.GRID_SIZE*this.SQUARES_HIGH),
                {
                    line_width: this.BORDER_WIDTH,
                    color: COLOR_SCHEME.borders
                }
            );
        
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



