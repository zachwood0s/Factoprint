var InputManager = (function () {
    function InputManager() {
    }
    InputManager.IsKeyDown = function (key) {
        return this.keys[key];
    };
    InputManager.HandleKeyPress = function (key) {
        this.keys[key] = true;
    };
    InputManager.HandleKeyRelease = function (key) {
        this.keys[key] = false;
    };
    InputManager.HandleMouseMove = function (x, y) {
        this.mouse_position.x = x;
        this.mouse_position.y = y;
    };
    InputManager.keys = [];
    InputManager.mouse_position = new Point(0, 0);
    return InputManager;
}());
window.onkeydown = function (e) {
    InputManager.HandleKeyPress(e.keyCode);
};
window.onkeyup = function (e) {
    InputManager.HandleKeyRelease(e.keyCode);
};
window.onmousemove = function (e) {
    InputManager.HandleMouseMove(e.clientX, e.clientY);
};
//# sourceMappingURL=InputManager.js.map