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
    DrawHelper.ClearScreen = function (ctx) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    DrawHelper.camera_position = new Point(0, 0);
    return DrawHelper;
}());
//# sourceMappingURL=DrawHelper.js.map