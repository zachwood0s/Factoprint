var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.Copy = function () {
        return new Point(this.x, this.y);
    };
    Point.prototype.Add = function (p) {
        this.x += p.x;
        this.y += p.y;
    };
    Point.prototype.AddC = function (p) {
        return new Point(this.x + p.x, this.y + p.y);
    };
    Point.prototype.Subtract = function (p) {
        this.x -= p.x;
        this.y -= p.y;
    };
    Point.prototype.SubtractC = function (p) {
        return new Point(this.x - p.x, this.y - p.y);
    };
    Point.prototype.Clamp = function (p1, p2) {
        if (this.x < p1.x)
            this.x = p1.x;
        if (this.y < p1.y)
            this.y = p1.y;
        if (this.x > p2.x)
            this.x = p2.x;
        if (this.y > p2.y)
            this.y = p2.y;
    };
    Point.prototype.Scale = function (s) {
        this.x *= s;
        this.y *= s;
    };
    Point.prototype.ScaleC = function (s) {
        return new Point(this.x * s, this.y * s);
    };
    return Point;
}());
//# sourceMappingURL=Utils.js.map