function trackTransforms(ctx) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    let xform = svg.createSVGMatrix();

    const scale = ctx.scale;
    ctx.scale = function(sx,sy){
        xform = xform.scaleNonUniform(sx,sy);
        return scale.call(ctx,sx,sy);
    };

    const rotate = ctx.rotate;
    ctx.rotate = function(radians){
        xform = xform.rotate(radians*180/Math.PI);
        return rotate.call(ctx,radians);
    };
    const translate = ctx.translate;
    ctx.translate = function(dx,dy){
        xform = xform.translate(dx,dy);
        return translate.call(ctx,dx,dy);
    };
    const transform = ctx.transform;
    ctx.transform = function(a,b,c,d,e,f){
        let m2 = svg.createSVGMatrix();
        m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
        xform = xform.multiply(m2);
        return transform.call(ctx,a,b,c,d,e,f);
    };

    let pt = svg.createSVGPoint();
    ctx.transformedPoint = function(x,y){
        pt.x=x; pt.y=y;
        return pt.matrixTransform(xform.inverse());
    }
}

const zooming = (ctx, canvas, MainFileHeader, MainFileRecord) => {
    canvas.width = 800;
    canvas.height = 600;
    trackTransforms(ctx);

    function redraw() {
        const p1 = ctx.transformedPoint(0, 0);
        const p2 = ctx.transformedPoint(canvas.width, canvas.height);
        ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

        const shapeType={
            polygon: 5
        }

        const box = {
            xMin: MainFileHeader.xMin,
            xMax: MainFileHeader.xMax,
            yMin: MainFileHeader.yMin,
            yMax: MainFileHeader.yMax
        }
        const coordinateTransferX = (x) => (x - box.xMin) / (box.xMax - box.xMin) * ctx.canvas.height;
        const coordinateTransferY = (y) => (ctx.canvas.height - (y - box.yMin) / (box.yMax - box.yMin) * ctx.canvas.height);

        if (MainFileHeader.shapeType === shapeType.polygon) {
            MainFileRecord.forEach(record => {
                let curPosition = 0;
                const recordContent = record.recordContent;
                for (let i = 0; i < recordContent.numParts; i++) {
                    const nextPart = (recordContent.numParts - 1 - i === 0) ? recordContent.numPoints : recordContent.parts[i + 1];
                    ctx.fillStyle = "rgb(153, 255, 51)";
                    ctx.beginPath();
                    const transedX = coordinateTransferX(recordContent.points[curPosition].x);
                    const transedY = coordinateTransferY(recordContent.points[curPosition].y);
                    ctx.moveTo(transedX, transedY);
                    curPosition += 1;
                    for (let j = curPosition; j < nextPart; j++) {
                        const nextX = coordinateTransferX(recordContent.points[j].x);
                        const nextY = coordinateTransferY(recordContent.points[j].y);
                        ctx.lineTo(nextX, nextY);
                    }
                    ctx.fill();
                    ctx.stroke();
                    curPosition = nextPart;
                }
            })
        }
    }

    redraw();

    let lastX = canvas.width / 2, lastY = canvas.height / 2;
    let dragStart, dragged;
    canvas.addEventListener('mousedown', function (evt) {
        document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragStart = ctx.transformedPoint(lastX, lastY);
        dragged = false;
    }, false);
    canvas.addEventListener('mousemove', function (evt) {
        lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
        lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
        dragged = true;
        if (dragStart) {
            const pt = ctx.transformedPoint(lastX, lastY);
            ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
            redraw();
        }
    }, false);
    canvas.addEventListener('mouseup', function (evt) {
        dragStart = null;
        if (!dragged) zoom(evt.shiftKey ? -1 : 1);
    }, false);

    let scaleFactor = 1.1;
    const zoom = function (clicks) {
        let pt = ctx.transformedPoint(lastX, lastY);
        ctx.translate(pt.x, pt.y);
        let factor = Math.pow(scaleFactor, clicks);
        ctx.scale(factor, factor);
        ctx.translate(-pt.x, -pt.y);
        redraw();
    }

    const handleScroll = function (evt) {
        const delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
        if (delta) zoom(delta);
        return evt.preventDefault() && false;
    };
    canvas.addEventListener('DOMMouseScroll', handleScroll, false);
    canvas.addEventListener('mousewheel', handleScroll, false);


}

export default zooming;