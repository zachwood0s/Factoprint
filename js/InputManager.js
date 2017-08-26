"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = require("./Utils");
var InputManager = (function () {
    function InputManager() {
    }
    InputManager.IsKeyDown = function (key) {
        return this.keys[key];
    };
    InputManager.HandleKeyPress = function (key) {
        this.keys[key] = true;
        if (this.on_press_events[key]) {
            for (var _i = 0, _a = this.on_press_events[key]; _i < _a.length; _i++) {
                var event_1 = _a[_i];
                event_1();
            }
        }
    };
    InputManager.HandleKeyRelease = function (key) {
        this.keys[key] = false;
        if (this.on_release_events[key]) {
            for (var _i = 0, _a = this.on_release_events[key]; _i < _a.length; _i++) {
                var event_2 = _a[_i];
                event_2();
            }
        }
    };
    InputManager.HandleMouseMove = function (x, y) {
        this.mouse_position.x = x;
        this.mouse_position.y = y;
    };
    InputManager.AddKeyEvent = function (on_press, key_code, event) {
        if (on_press) {
            if (this.on_press_events[key_code] === undefined)
                this.on_press_events[key_code] = [];
            this.on_press_events[key_code].push(event);
        }
        else {
            if (this.on_release_events[key_code] === undefined)
                this.on_release_events[key_code] = [];
            this.on_release_events[key_code].push(event);
        }
    };
    InputManager.HandleMouseDown = function (x, y, b) {
        this.mouse_down_position = new Utils_1.Point(x, y);
        this.is_mouse_down[b] = true;
    };
    InputManager.HandleMouseUp = function (x, y, b) {
        this.mouse_up_position = new Utils_1.Point(x, y);
        this.is_mouse_down[b] = false;
    };
    InputManager.IsMouseDown = function (b) {
        return this.is_mouse_down[b];
    };
    InputManager.keys = [];
    InputManager.mouse_position = new Utils_1.Point(0, 0);
    InputManager.on_press_events = [];
    InputManager.on_release_events = [];
    InputManager.is_mouse_down = [false, false, false];
    InputManager.mouse_down_position = new Utils_1.Point(0, 0);
    InputManager.mouse_up_position = new Utils_1.Point(0, 0);
    return InputManager;
}());
exports.InputManager = InputManager;
window.onkeydown = function (e) {
    InputManager.HandleKeyPress(e.keyCode);
};
window.onkeyup = function (e) {
    InputManager.HandleKeyRelease(e.keyCode);
};
window.onmousemove = function (e) {
    InputManager.HandleMouseMove(e.clientX, e.clientY);
};
window.onmousedown = function (e) {
    InputManager.HandleMouseDown(e.clientX, e.clientY, e.button);
};
window.onmouseup = function (e) {
    InputManager.HandleMouseUp(e.clientX, e.clientY, e.button);
};
//# sourceMappingURL=InputManager.js.map