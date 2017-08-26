"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pako = require("pako");
var Utils_1 = require("./Utils");
var DrawHelper_1 = require("./DrawHelper");
var InputManager_1 = require("./InputManager");
var Entity_1 = require("./Entity");
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
        return p.AddC(DrawHelper_1.DrawHelper.camera_position);
    };
    Editor.CameraToGridCoords = function (p) {
        return new Utils_1.Point(Math.round(p.x / this.GRID_SIZE - .5), Math.round(p.y / this.GRID_SIZE - .5));
    };
    Editor.ScreenToGridCoords = function (p) {
        return this.CameraToGridCoords(this.ScreenToCameraCoords(p));
    };
    Editor.DecodeString = function (b64) {
        try {
            var str_data = atob(b64.substr(1));
            var char_data = str_data.split('').map(function (x) { return x.charCodeAt(0); });
            var bin_data = new Uint8Array(char_data);
            var data = pako.inflate(bin_data);
            var str = String.fromCharCode.apply(null, new Uint16Array(data));
            var json_data = JSON.parse(str);
            console.log(json_data);
            return json_data;
        }
        catch (e) {
            console.log("Oops... tis borked");
        }
    };
    Editor.LoadBlueprint = function (b64) {
        var blueprint = this.DecodeString(b64).blueprint;
        for (var _i = 0, _a = blueprint.entities; _i < _a.length; _i++) {
            var entity = _a[_i];
            console.log(entity);
        }
    };
    Editor.GRID_SIZE = 40;
    Editor.ENTITY_SCALEUP = 10;
    Editor.SQUARES_WIDE = 100;
    Editor.SQUARES_HIGH = 100;
    Editor.BORDER_WIDTH = 4;
    Editor.FONT_SIZE = 25;
    Editor.CAMERA_MOVE_SPEED = 10;
    Editor.CURRENT_SELECTED_ITEM_OPACITY = .5;
    Editor.last_mouse_grid_position = new Utils_1.Point(0, 0);
    Editor.mouse_grid_position = new Utils_1.Point(0, 0);
    Editor.unused_ids = [];
    Editor.entities = [];
    Editor.global_animators = [];
    Editor.Init = function () {
        var _this = this;
        this.canvas = document.getElementById("editorCanvas");
        this.ctx = this.canvas.getContext("2d");
        //Setup any styling
        this.canvas.style.backgroundColor = COLOR_SCHEME.background;
        this.canvas.oncontextmenu = function (e) {
            e.preventDefault();
        };
        //test
        var test = "0eNqV0ckKwjAQBuB3+c8p2LRUzKuISJdBAu0kJFFaSt7dLh4EA9LjbB/DzIymf5J1mgPUDN0a9lDXGV4/uO7XXJgsQUEHGiDA9bBGNFpH3mfB1eytcSFrqA+IApo7GqHyeBMgDjpo2sUtmO78HBpyS8M/S8Aav4wbXrdYyKwQmKBOMYofTR7X8o8m0GlH7V6SCbs4bCfpMkGXh+kiRVfrsbcHqa9/CrzI+b2hLGVVnWUuLzG+ARDGqi4=";
        this.LoadBlueprint(test);
        InputManager_1.InputManager.AddKeyEvent(false, 81 /* DropItem */, function () {
            _this.current_selected_item = undefined;
        });
        InputManager_1.InputManager.AddKeyEvent(false, 82 /* Rotate */, function () {
            if (_this.current_selected_item) {
                _this.current_selected_item.Rotate();
            }
        });
        this.CreateMenu();
        this.CreateGrid();
        this.Resize();
        Entity_1.Data.LoadImages();
    };
    Editor.Update = function () {
        //Handle line snap
        if (InputManager_1.InputManager.IsKeyDown(16 /* LineSnap */)) {
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
        this.mouse_grid_position = this.ScreenToGridCoords(InputManager_1.InputManager.mouse_position);
        this.mouse_grid_position.Clamp({ x: 1, y: 1 }, { x: this.SQUARES_WIDE, y: this.SQUARES_HIGH });
        if (this.line_snap_type == LINE_SNAP.Horizontal) {
            this.mouse_grid_position.y = this.last_mouse_grid_position.y;
        }
        else if (this.line_snap_type == LINE_SNAP.Vertical) {
            this.mouse_grid_position.x = this.last_mouse_grid_position.x;
        }
        DrawHelper_1.DrawHelper.ClearScreen(this.ctx);
        //Handle Camera Movement
        if (InputManager_1.InputManager.IsKeyDown(68 /* MoveRight */)) {
            DrawHelper_1.DrawHelper.camera_position.Add({ x: this.CAMERA_MOVE_SPEED, y: 0 });
        }
        else if (InputManager_1.InputManager.IsKeyDown(65 /* MoveLeft */)) {
            DrawHelper_1.DrawHelper.camera_position.Add({ x: -this.CAMERA_MOVE_SPEED, y: 0 });
        }
        if (InputManager_1.InputManager.IsKeyDown(83 /* MoveDown */)) {
            DrawHelper_1.DrawHelper.camera_position.Add({ x: 0, y: this.CAMERA_MOVE_SPEED });
        }
        else if (InputManager_1.InputManager.IsKeyDown(87 /* MoveUp */)) {
            DrawHelper_1.DrawHelper.camera_position.Add({ x: 0, y: -this.CAMERA_MOVE_SPEED });
        }
        DrawHelper_1.DrawHelper.camera_position.Clamp({ x: 0, y: 0 }, {
            x: this.GRID_SIZE * this.SQUARES_WIDE - this.canvas.width,
            y: this.GRID_SIZE * this.SQUARES_HIGH - this.canvas.height
        });
        //Handle Placement
        if (this.current_selected_item && InputManager_1.InputManager.IsMouseDown(0)) {
            this.TryPlace();
        }
        if (InputManager_1.InputManager.IsMouseDown(2)) {
            this.TryRemove();
        }
        this.DrawCrosshairs();
        this.DrawGrid();
        for (var key in this.global_animators) {
            var animator = this.global_animators[key];
            animator.Update();
        }
        for (var _i = 0, _a = this.entities; _i < _a.length; _i++) {
            var entity = _a[_i];
            entity.Draw(this.ctx, 1);
        }
        if (this.current_selected_item) {
            this.current_selected_item.position = this.mouse_grid_position.Copy();
            this.current_selected_item.Draw(this.ctx, this.CURRENT_SELECTED_ITEM_OPACITY);
        }
    };
    Editor.TryRemove = function () {
        if (this.grid[this.mouse_grid_position.x][this.mouse_grid_position.y]) {
            var id_1 = this.grid[this.mouse_grid_position.x][this.mouse_grid_position.y];
            var entity = this.entities.filter(function (value) {
                return value.id == id_1;
            })[0];
            var index = this.entities.indexOf(entity);
            if (index > -1) {
                this.entities.splice(index, 1);
            }
            for (var i = 0; i < this.grid.length; i++) {
                for (var x = 0; x < this.grid[i].length; x++) {
                    if (this.grid[i][x] == id_1) {
                        this.grid[i][x] == undefined;
                    }
                }
            }
            console.log(entity);
        }
    };
    Editor.TryPlace = function () {
        console.log("Trying place at " + this.mouse_grid_position);
        console.log(this.grid[this.mouse_grid_position.x][this.mouse_grid_position.y]);
        if (!this.grid[this.mouse_grid_position.x][this.mouse_grid_position.y]) {
            console.log("-Space is empty");
            for (var x = 0; x < this.current_selected_item.properties.grid_size.x; x++) {
                for (var y = 0; y < this.current_selected_item.properties.grid_size.y; y++) {
                    console.log("Placing element with id: " + this.current_selected_item.id);
                    this.grid[this.mouse_grid_position.x + x][this.mouse_grid_position.y + y] = this.current_selected_item.id;
                }
            }
            this.current_selected_item.position = this.mouse_grid_position;
            this.entities.push(this.current_selected_item);
            var entity_name = this.current_selected_item.properties.name;
            var direction = this.current_selected_item.GetDirection();
            this.current_selected_item = new Entity_1.Entity(this.GetNextID(), this.mouse_grid_position.Copy());
            this.current_selected_item.LoadFromData(entity_name);
            this.current_selected_item.SetDirection(direction);
            console.log(this.grid);
            // console.log("placed");       
        }
        else {
            // console.log("-Space is FULL");
        }
        //console.log(this.current_selected_item);
    };
    Editor.DrawCrosshairs = function () {
        var crosshair_pos = this.mouse_grid_position.ScaleC(this.GRID_SIZE);
        //Horizontal
        DrawHelper_1.DrawHelper.DrawRect(this.ctx, new Utils_1.Point(DrawHelper_1.DrawHelper.camera_position.x, crosshair_pos.y), new Utils_1.Point(DrawHelper_1.DrawHelper.camera_position.x + this.canvas.width, this.GRID_SIZE), {
            color: COLOR_SCHEME.crosshair
        });
        //Vertical
        DrawHelper_1.DrawHelper.DrawRect(this.ctx, new Utils_1.Point(crosshair_pos.x, DrawHelper_1.DrawHelper.camera_position.y), new Utils_1.Point(this.GRID_SIZE, DrawHelper_1.DrawHelper.camera_position.y + this.canvas.height), {
            color: COLOR_SCHEME.crosshair
        });
    };
    Editor.GetNextID = function () {
        return (Editor.unused_ids.length > 0) ? Editor.unused_ids.pop() : Editor.entities.length;
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
            DrawHelper_1.DrawHelper.DrawLine(this.ctx, new Utils_1.Point(x_pos, 0), new Utils_1.Point(x_pos, this.GRID_SIZE * this.SQUARES_HIGH), {
                line_width: this.BORDER_WIDTH,
                color: COLOR_SCHEME.borders
            });
            //Draw Numbers
            DrawHelper_1.DrawHelper.DrawText(this.ctx, new Utils_1.Point(x_pos + text_centering_factor, this.FONT_SIZE + text_centering_factor - 5), ("0" + x).slice(-2), {
                color: COLOR_SCHEME.borders,
                font: "700 " + this.FONT_SIZE + "px Share Tech Mono"
            });
        }
        //Horizontal Lines
        for (var y = 1; y < this.SQUARES_HIGH; y++) {
            var y_pos = y * this.GRID_SIZE;
            //Draw Lines
            DrawHelper_1.DrawHelper.DrawLine(this.ctx, new Utils_1.Point(0, y_pos), new Utils_1.Point(this.GRID_SIZE * this.SQUARES_WIDE, y_pos), {
                line_width: this.BORDER_WIDTH,
                color: COLOR_SCHEME.borders
            });
            //Draw Numbers
            DrawHelper_1.DrawHelper.DrawText(this.ctx, new Utils_1.Point(text_centering_factor, y_pos + this.FONT_SIZE + text_centering_factor - 5), ("0" + y).slice(-2), {
                color: COLOR_SCHEME.borders,
                font: "700 " + this.FONT_SIZE + "px Share Tech Mono"
            });
        }
    };
    Editor.CreateMenu = function () {
        InputManager_1.InputManager.AddKeyEvent(false, 17 /* ToggleMenu */, function () {
            Editor.ToggleMenu();
            console.log(Editor.current_selected_item);
        });
        this.menu = document.getElementById("menu");
        var _loop_1 = function (type) {
            var new_link = document.createElement("div");
            new_link.innerHTML = type.split("-").join(" ");
            var new_ul = document.createElement("ul");
            new_ul.id = type;
            new_link.onclick = function () {
                if (new_ul.classList.contains("open")) {
                    new_ul.classList.remove("open");
                }
                else {
                    new_ul.classList.add("open");
                }
            };
            this_1.menu.appendChild(new_link);
            this_1.menu.appendChild(new_ul);
        };
        var this_1 = this;
        //create new ul for each menu type
        for (var _i = 0, _a = Entity_1.Data.menu_types; _i < _a.length; _i++) {
            var type = _a[_i];
            _loop_1(type);
        }
        var _loop_2 = function (entity) {
            var new_li = document.createElement("li");
            new_li.innerHTML = entity.name.split("-").join(" ");
            var value = entity.name;
            new_li.onclick = function () {
                var id = Editor.GetNextID();
                var new_entity = new Entity_1.Entity(id, Editor.mouse_grid_position);
                new_entity.LoadFromData(value);
                Editor.current_selected_item = new_entity;
            };
            document.getElementById(entity.menu_type).appendChild(new_li);
        };
        for (var _b = 0, _c = Entity_1.Data.entities; _b < _c.length; _b++) {
            var entity = _c[_b];
            _loop_2(entity);
        }
    };
    Editor.ToggleMenu = function () {
        if (this.menu.classList.contains("open")) {
            this.menu.classList.remove("open");
        }
        else {
            this.menu.classList.add("open");
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
exports.Editor = Editor;
var Animator = (function () {
    function Animator(frame_count, ticks_per_frame) {
        this.current_frame = 0;
        this.frame_count = frame_count;
        this.current_tick = 0;
        this.ticks_per_frame = ticks_per_frame;
    }
    Animator.prototype.Update = function () {
        if (this.current_tick < this.ticks_per_frame) {
            this.current_tick++;
        }
        else {
            this.current_tick = 0;
            this.current_frame++;
            if (this.current_frame >= this.frame_count) {
                this.current_frame = 0;
            }
        }
    };
    Animator.prototype.CurrentFrame = function () {
        return this.current_frame;
    };
    return Animator;
}());
exports.Animator = Animator;
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