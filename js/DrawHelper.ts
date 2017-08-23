import {Point} from "./Utils"

interface RenderOptions{
    line_width?: number;
    color?: string;
    font?: string;
}
class DrawHelper{
    static camera_position: Point = new Point(0,0);
    
    static DrawLine(ctx: CanvasRenderingContext2D, p1: Point, p2: Point, options: RenderOptions){
        if(options.color) ctx.strokeStyle = options.color;
        if(options.line_width) ctx.lineWidth = options.line_width;

        p1.Subtract(this.camera_position);
        p2.Subtract(this.camera_position);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
    static DrawRect(ctx: CanvasRenderingContext2D, p: Point, dimensions: Point, options: RenderOptions){
        p.Subtract(this.camera_position);

        if(options.color) ctx.fillStyle = options.color;
        ctx.fillRect(p.x, p.y, dimensions.x, dimensions.y);
    }
    static DrawText(ctx: CanvasRenderingContext2D, p: Point, text:string, options: RenderOptions){
        p.Subtract(this.camera_position);
        
        if(options.color) ctx.fillStyle = options.color;
        if(options.font) ctx.font = options.font;
        ctx.fillText(text, p.x, p.y);
    }

    static ClearScreen(ctx: CanvasRenderingContext2D){
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
}


export {
    DrawHelper
}