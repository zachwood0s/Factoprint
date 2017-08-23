"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pako = require("pako");
var COLOR_SCHEME = {
    background: "#282827",
    borders: "#3b3b3b",
    crosshair: "#e0e0e0",
};
var LINE_SNAP;
(function (LINE_SNAP) {
    LINE_SNAP[LINE_SNAP["None"] = 0] = "None";
    LINE_SNAP[LINE_SNAP["Vertical"] = 1] = "Vertical";
    LINE_SNAP[LINE_SNAP["Horizontal"] = 2] = "Horizontal";
})(LINE_SNAP || (LINE_SNAP = {}));
var Editor = (function () {
    function Editor() {
    }
    Editor.ScreenToCameraCoords = function (p) {
        return p.AddC(DrawHelper.camera_position);
    };
    Editor.CameraToGridCoords = function (p) {
        return new Point(Math.round(p.x / this.GRID_SIZE - .5), Math.round(p.y / this.GRID_SIZE - .5));
    };
    Editor.ScreenToGridCoords = function (p) {
        return this.CameraToGridCoords(this.ScreenToCameraCoords(p));
    };
    Editor.GRID_SIZE = 40;
    Editor.SQUARES_WIDE = 100;
    Editor.SQUARES_HIGH = 100;
    Editor.BORDER_WIDTH = 4;
    Editor.FONT_SIZE = 25;
    Editor.CAMERA_MOVE_SPEED = 10;
    Editor.last_mouse_grid_position = new Point(0, 0);
    Editor.mouse_grid_position = new Point(0, 0);
    Editor.Init = function () {
        this.canvas = document.getElementById("editorCanvas");
        this.ctx = this.canvas.getContext("2d");
        //Setup any styling
        this.canvas.style.backgroundColor = COLOR_SCHEME.background;
        var input = new Uint8Array(10);
        console.log(pako.deflate());
        this.CreateGrid();
        this.Resize();
    };
    Editor.Update = function () {
        //Handle line snap
        if (InputManager.IsKeyDown(16 /* LineSnap */)) {
            if (this.line_snap_type == LINE_SNAP.None) {
                var diff = this.mouse_grid_position.SubtractC(this.last_mouse_grid_position);
                if (diff.x != 0) {
                    this.line_snap_type = LINE_SNAP.Horizontal;
                }
                if (diff.y != 0) {
                    this.line_snap_type = LINE_SNAP.Vertical;
                }
            }
        }
        else {
            this.line_snap_type = LINE_SNAP.None;
        }
        this.last_mouse_grid_position = this.mouse_grid_position.Copy();
        this.mouse_grid_position = this.ScreenToGridCoords(InputManager.mouse_position);
        this.mouse_grid_position.Clamp({ x: 1, y: 1 }, { x: this.SQUARES_WIDE, y: this.SQUARES_HIGH });
        if (this.line_snap_type == LINE_SNAP.Horizontal) {
            this.mouse_grid_position.y = this.last_mouse_grid_position.y;
        }
        else if (this.line_snap_type == LINE_SNAP.Vertical) {
            this.mouse_grid_position.x = this.last_mouse_grid_position.x;
        }
        DrawHelper.ClearScreen(this.ctx);
        //Handle Camera Movement
        if (InputManager.IsKeyDown(68 /* MoveRight */)) {
            DrawHelper.camera_position.Add({ x: this.CAMERA_MOVE_SPEED, y: 0 });
        }
        else if (InputManager.IsKeyDown(65 /* MoveLeft */)) {
            DrawHelper.camera_position.Add({ x: -this.CAMERA_MOVE_SPEED, y: 0 });
        }
        if (InputManager.IsKeyDown(83 /* MoveDown */)) {
            DrawHelper.camera_position.Add({ x: 0, y: this.CAMERA_MOVE_SPEED });
        }
        else if (InputManager.IsKeyDown(87 /* MoveUp */)) {
            DrawHelper.camera_position.Add({ x: 0, y: -this.CAMERA_MOVE_SPEED });
        }
        DrawHelper.camera_position.Clamp({ x: 0, y: 0 }, {
            x: this.GRID_SIZE * this.SQUARES_WIDE - this.canvas.width,
            y: this.GRID_SIZE * this.SQUARES_HIGH - this.canvas.height
        });
        this.DrawCrosshairs();
        this.DrawGrid();
    };
    Editor.DrawCrosshairs = function () {
        var crosshair_pos = this.mouse_grid_position.ScaleC(this.GRID_SIZE);
        //Horizontal
        DrawHelper.DrawRect(this.ctx, new Point(DrawHelper.camera_position.x, crosshair_pos.y), new Point(DrawHelper.camera_position.x + this.canvas.width, this.GRID_SIZE), {
            color: COLOR_SCHEME.crosshair
        });
        //Vertical
        DrawHelper.DrawRect(this.ctx, new Point(crosshair_pos.x, DrawHelper.camera_position.y), new Point(this.GRID_SIZE, DrawHelper.camera_position.y + this.canvas.height), {
            color: COLOR_SCHEME.crosshair
        });
    };
    Editor.CreateGrid = function () {
        this.grid = [];
        for (var i = 0; i < this.SQUARES_WIDE; i++) {
            this.grid[i] = [];
        }
    };
    Editor.DrawGrid = function () {
        var text_centering_factor = (this.GRID_SIZE - this.FONT_SIZE) / 2;
        //Vertical Lines
        for (var x = 1; x < this.SQUARES_WIDE; x++) {
            var x_pos = x * this.GRID_SIZE;
            //Draw Lines
            DrawHelper.DrawLine(this.ctx, new Point(x_pos, 0), new Point(x_pos, this.GRID_SIZE * this.SQUARES_HIGH), {
                line_width: this.BORDER_WIDTH,
                color: COLOR_SCHEME.borders
            });
            //Draw Numbers
            DrawHelper.DrawText(this.ctx, new Point(x_pos + text_centering_factor, this.FONT_SIZE + text_centering_factor - 5), ("0" + x).slice(-2), {
                color: COLOR_SCHEME.borders,
                font: "700 " + this.FONT_SIZE + "px Share Tech Mono"
            });
        }
        //Horizontal Lines
        for (var y = 1; y < this.SQUARES_HIGH; y++) {
            var y_pos = y * this.GRID_SIZE;
            //Draw Lines
            DrawHelper.DrawLine(this.ctx, new Point(0, y_pos), new Point(this.GRID_SIZE * this.SQUARES_WIDE, y_pos), {
                line_width: this.BORDER_WIDTH,
                color: COLOR_SCHEME.borders
            });
            //Draw Numbers
            DrawHelper.DrawText(this.ctx, new Point(text_centering_factor, y_pos + this.FONT_SIZE + text_centering_factor - 5), ("0" + y).slice(-2), {
                color: COLOR_SCHEME.borders,
                font: "700 " + this.FONT_SIZE + "px Share Tech Mono"
            });
        }
    };
    Editor.Resize = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.height = window.innerHeight + "px";
        this.canvas.style.width = window.innerWidth + "px";
    };
    return Editor;
}());
window.onload = function () {
    Editor.Init();
    UpdateLoop();
};
window.onresize = function () {
    Editor.Resize();
};
function UpdateLoop() {
    //Do this so Editor can still use 'this' within the update function
    Editor.Update();
    window.requestAnimationFrame(UpdateLoop);
}
//# sourceMappingURL=index.js.map