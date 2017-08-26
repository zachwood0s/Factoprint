import {Point} from "./Utils"

const enum KeyBindings{
    MoveRight = 68,
    MoveLeft = 65,
    MoveUp = 87,
    MoveDown = 83,
    LineSnap = 16,
    ToggleMenu = 69,
    DropItem = 81,
    Rotate = 82,
}

class InputManager{
    private static keys: boolean[] = [];
    static readonly mouse_position: Point = new Point(0, 0);
    
    private static on_press_events = [];
    private static on_release_events = [];

    private static is_mouse_down: boolean[] = [false, false, false];
    static mouse_down_position: Point = new Point(0,0);
    static mouse_up_position: Point = new Point(0,0);

    static IsKeyDown(key: number): boolean{
        return this.keys[key];
    }

    static HandleKeyPress(key: number){
        this.keys[key] = true;

        if(this.on_press_events[key]){
            for(let event of this.on_press_events[key]){
                event();
            }
        }
    }
    static HandleKeyRelease(key: number){
        this.keys[key] = false;

        if(this.on_release_events[key]){
            for(let event of this.on_release_events[key]){
                event();
            }
        }
    }
    static HandleMouseMove(x:number, y:number){
        this.mouse_position.x = x;
        this.mouse_position.y = y;
    }

    static AddKeyEvent(on_press: boolean, key_code: number, event: () => void){
        if(on_press){
            if(this.on_press_events[key_code] === undefined) this.on_press_events[key_code] = [];
            this.on_press_events[key_code].push(event);
        }
        else{
            if(this.on_release_events[key_code] === undefined) this.on_release_events[key_code] = [];
            this.on_release_events[key_code].push(event);
        }
    } 

    static HandleMouseDown(x: number, y:number, b: number){
        this.mouse_down_position = new Point(x, y);
        this.is_mouse_down[b] = true;
    }
    static HandleMouseUp(x:number, y:number, b: number){
        this.mouse_up_position = new Point(x,y);
        this.is_mouse_down[b] = false;
    }
    static IsMouseDown(b: number){
        return this.is_mouse_down[b];
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
window.onmousedown = function(e){
    InputManager.HandleMouseDown(e.clientX, e.clientY, e.button);
}
window.onmouseup = function(e){
    InputManager.HandleMouseUp(e.clientX, e.clientY, e.button);
}

export {
    InputManager,
    KeyBindings
}
