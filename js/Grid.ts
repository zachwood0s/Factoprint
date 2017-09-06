import {Point} from "./Utils"
import {DrawHelper} from "./DrawHelper"
import {Editor} from "./index"
import {Entity} from "./Entity"

export class Grid{
    private _cells: number[][];
    private _entities: Entity[] = [];
    private _unused_ids: number[] = [];
    private _grid_size: number;
    private _grid_dimensions: Point;
    private _border_width: number;
    private _draw_dimensions: Point;
    private _crosshair_color: string;
    private _border_color: string;
    private _background_color: string;
    private _font_size: number;

    constructor(grid_size: number, dim: Point, border_w: number, 
        border_color: string, crosshair_color: string,
        background_color: string, font_size: number
    ){
        this._grid_size = grid_size;
        this._grid_dimensions = dim;
        this._border_width = border_w;
        this._border_color = border_color;
        this._crosshair_color = crosshair_color;
        this._background_color = background_color;
        this._font_size = font_size;


        this._cells = new Array(this._grid_dimensions.x);
        for(let i = 0; i<this._grid_dimensions.x; i++){
            this._cells[i] = new Array(this._grid_dimensions.y);
        }
    }

    public Resize(draw_dimensions: Point){
        this._draw_dimensions = draw_dimensions;
    }
    public DrawRulers(ctx: CanvasRenderingContext2D){
        let text_centering_factor = (this._grid_size - this._font_size )/2;
        
        DrawHelper.DrawRect(
            ctx,
            new Point(DrawHelper.camera_position.x,DrawHelper.camera_position.y),
            new Point(this._draw_dimensions.x, this._grid_size),
            {
                color:this._background_color
            }
        )
        DrawHelper.DrawRect(
            ctx,
            new Point(DrawHelper.camera_position.x,DrawHelper.camera_position.y),
            new Point(this._grid_size, this._draw_dimensions.y),
            {
                color:this._background_color
            }
        )
        //Draw Numbers horizontal
        for(let x = 1; x<this._grid_dimensions.x; x++){
            let x_pos = x*this._grid_size;
    

            DrawHelper.DrawText(
                ctx, 
                new Point(
                    x_pos+text_centering_factor, 
                    this._font_size +text_centering_factor - 5 + DrawHelper.camera_position.y
                ),
                ("0"+x).slice(-2),
                {
                    color: this._border_color,
                    font: "700 "+this._font_size +"px Share Tech Mono"
                }
            );
            DrawHelper.DrawLine(
                ctx,
                new Point(x_pos+this._grid_size, DrawHelper.camera_position.y),
                new Point(x_pos+this._grid_size, DrawHelper.camera_position.y + this._grid_size),
                {
                    color: this._border_color,
                    line_width: this._border_width
                }
            )
            
        }


        //Draw Numbers vertical
        for(let y = 1; y<this._grid_dimensions.y; y++){
            let y_pos = y*this._grid_size;

            DrawHelper.DrawText(
                ctx, 
                new Point(
                    text_centering_factor + DrawHelper.camera_position.x, 
                    y_pos+this._font_size +text_centering_factor - 5
                ),
                ("0"+y).slice(-2),
                {
                    color: this._border_color,
                    font: "700 "+this._font_size +"px Share Tech Mono"
                }
            );
            DrawHelper.DrawLine(
                ctx,
                new Point(DrawHelper.camera_position.x, y_pos+this._grid_size),
                new Point(DrawHelper.camera_position.x + this._grid_size, y_pos+this._grid_size),
                {
                    color: this._border_color,
                    line_width: this._border_width
                }
            )
        }

        //Little square in top left to hide overlapping numbers
        DrawHelper.DrawRect(
            ctx,
            new Point(DrawHelper.camera_position.x,DrawHelper.camera_position.y),
            new Point(this._grid_size, this._grid_size),
            {
                color:this._background_color
            }
        )

        //Bottom border below numbers
        DrawHelper.DrawLine(
            ctx,
            new Point(DrawHelper.camera_position.x, DrawHelper.camera_position.y+this._grid_size),
            new Point(DrawHelper.camera_position.x+this._draw_dimensions.x, DrawHelper.camera_position.y+this._grid_size),
            {
                color:this._border_color,
                line_width: this._border_width
            }
        )
        //Right border to the right of numbers
        DrawHelper.DrawLine(
            ctx,
            new Point(DrawHelper.camera_position.x+this._grid_size, DrawHelper.camera_position.y),
            new Point(DrawHelper.camera_position.x+this._grid_size, DrawHelper.camera_position.y+this._draw_dimensions.y),
            {
                color:this._border_color,
                line_width: this._border_width
            }
        )
    }

    public DrawCrosshairs(ctx: CanvasRenderingContext2D){
        let crosshair_pos: Point = Editor.mouse_grid_position.ScaleC(this._grid_size);
    
        //Horizontal
        DrawHelper.DrawRect(
            ctx,
            new Point(
                DrawHelper.camera_position.x,
                crosshair_pos.y
            ),
            new Point(
                DrawHelper.camera_position.x + this._draw_dimensions.x,
                this._grid_size
            ),
            {
                color:this._crosshair_color
            }
        );

        //Vertical
        DrawHelper.DrawRect(
            ctx,
            new Point(
                crosshair_pos.x,
                DrawHelper.camera_position.y,
            ),
            new Point(
                this._grid_size,
                DrawHelper.camera_position.y + this._draw_dimensions.y,
            ),
            {
                color:this._crosshair_color
            }
        );
    }

    public DrawGrid(ctx: CanvasRenderingContext2D){
        //Vertical Lines
        for(let x = 1; x<this._grid_dimensions.x; x++){
            let x_pos = x*this._grid_size;

            //Draw Lines
            DrawHelper.DrawLine(
                ctx, 
                new Point(x_pos, 0),
                new Point(x_pos, this._grid_size*this._grid_dimensions.y),
                {
                    line_width: this._border_width,
                    color: this._border_color
                }
            );
        }
        //Horizontal Lines
        for(let y = 1; y<this._grid_dimensions.y; y++){
            let y_pos = y*this._grid_size;


            DrawHelper.DrawLine(
                ctx, 
                new Point(0, y_pos),
                new Point(this._grid_size*this._grid_dimensions.x, y_pos),
                {
                    line_width: this._border_width,
                    color: this._border_color
                }
            );
        }


        //Entities
        
        for(let entity of this._entities){
            if(entity){
                entity.Draw(ctx, 1);
            }
        }
    }

    public GetNextID(): number{
        let id = (this._unused_ids.length > 0)?this._unused_ids.pop():this._entities.length;   
        console.log("Assigning ID: "+id);
        return id; 
    }

    public IsClear(pos: Point,item: Entity){
        let result = {
            SameType: true,
            Empty: true,
        }
        for(let x = 0; x<item.properties.grid_size.x; x++){
            for(let y = 0; y<item.properties.grid_size.y; y++){

                let entity = this.GetEntityAtPos(new Point(pos.x + x, pos.y + y));
                if(entity!=null){

                    result.Empty = false;
                    console.log(entity.properties.type);
                    if(entity.properties.type != item.properties.type){
                        result.SameType = false;
                    }
                   // console.log(entity.position)
                    if(!entity.position.Equals(item.position)){
                        result.SameType = false;
                    }

                    if(entity.properties.grid_size.x != entity.properties.grid_size.y){
                        result.SameType = false;
                    }
                    //Prevent placing over the exact same block
                    //console.log("direction",entity.GetDirection(), this.current_selected_item.GetDirection())
                    if(entity.GetDirection() == item.GetDirection() &&
                       entity.properties.name == item.properties.name){
                        result.SameType = false;
                    }
                }
            }
        }
        return result;
    }
    public Place(entity: Entity, pos: Point){
        for(let x = 0; x<entity.properties.grid_size.x; x++){
            for(let y = 0; y<entity.properties.grid_size.y; y++){               
                this._cells[pos.x+x][pos.y+y] = entity.id;
            }
        }
        console.log("Gid place entity with id: "+entity.id);
        entity.position = pos;
        this._entities[entity.id] = entity;
    }
    public GetEntityAtPos(pos: Point): Entity{
        if(this._cells[pos.x][pos.y] !== undefined){
            let id = this._cells[pos.x][pos.y];
            let entity = this._entities.filter((value) =>{
                if(value){
                    return value.id == id;
                }
            })[0];
            return entity;
        }
        else{
            return null;
        }
    }
    public Remove(entity: Entity){  
        let index = this._entities.indexOf(entity);
        if(index > -1){
            this._entities[index] = undefined;
            //console.log(this._entities)
            //console.log("Removed entity: "+entity.id+" at index "+index);
        }
        //console.log(this._cells);

        for(var i = 0; i<this._cells.length; i++){
            for(var x = 0; x<this._cells[i].length; x++){
                if(this._cells[i][x] == entity.id){
                    this._cells[i][x] = undefined;
                }
            }
        }
        this._unused_ids.push(entity.id);
        //console.log(entity);
    }  
    public RemoveAtPos(pos: Point){
        let remove_entity = this.GetEntityAtPos(pos);
        if(remove_entity != null){
            this.Remove(remove_entity);
            //console.log(remove_entity);
        }
    }
}