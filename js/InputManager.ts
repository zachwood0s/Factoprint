
const enum KeyBindings{
    MoveRight = 68,
    MoveLeft = 65,
    MoveUp = 87,
    MoveDown = 83,
    LineSnap = 16,
}

class InputManager{
    private static keys: boolean[] = [];
    static mouse_position: Point = new Point(0, 0);
    
    static IsKeyDown(key: number): boolean{
        return this.keys[key];
    }

    static HandleKeyPress(key: number){
        this.keys[key] = true;
    }
    static HandleKeyRelease(key: number){
        this.keys[key] = false;
    }
    static HandleMouseMove(x:number, y:number){
        this.mouse_position.x = x;
        this.mouse_position.y = y;
    }
}

window.onkeydown = function(e){
    InputManager.HandleKeyPress(e.keyCode);
}
window.onkeyup = function(e){
    InputManager.HandleKeyRelease(e.keyCode);
}
window.onmousemove = function(e){
    InputManager.HandleMouseMove(e.clientX, e.clientY);
}