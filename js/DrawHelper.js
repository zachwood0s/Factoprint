"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = require("./Utils");
var DrawHelper = (function () {
    function DrawHelper() {
    }
    DrawHelper.DrawLine = function (ctx, p1, p2, options) {
        if (options.color)
            ctx.strokeStyle = options.color;
        if (options.line_width)
            ctx.lineWidth = options.line_width;
        p1.Subtract(this.camera_position);
        p2.Subtract(this.camera_position);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    };
    DrawHelper.DrawRect = function (ctx, p, dimensions, options) {
        p.Subtract(this.camera_position);
        if (options.color)
            ctx.fillStyle = options.color;
        ctx.fillRect(p.x, p.y, dimensions.x, dimensions.y);
    };
    DrawHelper.DrawText = function (ctx, p, text, options) {
        p.Subtract(this.camera_position);
        if (options.color)
            ctx.fillStyle = options.color;
        if (options.font)
            ctx.font = options.font;
        ctx.fillText(text, p.x, p.y);
    };
    DrawHelper.DrawImage = function (ctx, image, s, sD, d, dD, options) {
        ctx.save();
        var x_scale = (options.flip_horizontal) ? -1 : 1;
        var y_scale = (options.flip_vertical) ? -1 : 1;
        if (options.opacity)
            ctx.globalAlpha = options.opacity;
        // console.log(x_scale);
        ctx.scale(x_scale, y_scale);
        ctx.drawImage(image, s.x, s.y, sD.x, sD.y, x_scale * d.x, y_scale * d.y, x_scale * dD.x, y_scale * dD.y);
        ctx.restore();
    };
    DrawHelper.ClearScreen = function (ctx) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    DrawHelper.camera_position = new Utils_1.Point(0, 0);
    return DrawHelper;
}());
exports.DrawHelper = DrawHelper;
//# sourceMappingURL=DrawHelper.js.map