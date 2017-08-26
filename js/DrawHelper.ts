import {Point} from "./Utils"

interface RenderOptions{
    line_width?: number;
    color?: string;
    font?: string;
    flip_vertical?: boolean;
    flip_horizontal?: boolean;
    opacity?: number;
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
    static DrawImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, s:Point, sD:Point, d:Point, dD:Point, options:RenderOptions ){
        ctx.save();
        let x_scale = (options.flip_horizontal)?-1:1;
        let y_scale = (options.flip_vertical)?-1:1;
        
        if(options.opacity) ctx.globalAlpha = options.opacity;

       // console.log(x_scale);
        ctx.scale(x_scale, y_scale);
        ctx.drawImage(image, s.x, s.y, sD.x, sD.y, x_scale*d.x, y_scale*d.y, x_scale*dD.x, y_scale*dD.y);
        ctx.restore();
    }

    static ClearScreen(ctx: CanvasRenderingContext2D){
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
}


export {
    DrawHelper
}