import React, { useRef, useEffect } from 'react';
import zooming from './user_interface/Zooming.js';
import draw from './Draw.js';

const trackTransforms = (ctx) => {
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

const getTransPos = (MainFileHeader, MainFileRecord, ctx) => {
    const shapeType={
        polygon: 5
    }

    const box = {
        xMin: MainFileHeader.xMin,
        xMax: MainFileHeader.xMax,
        yMin: MainFileHeader.yMin,
        yMax: MainFileHeader.yMax
    }
    // const coordinateTransferX = (x) => Math.round((x - box.xMin) / (box.xMax - box.xMin) * ctx.canvas.height);
    const coordinateTransferX = (x) => ((x - box.xMin) / (box.xMax - box.xMin) * ctx.canvas.height);
    // const coordinateTransferY = (y) => Math.round((ctx.canvas.height - (y - box.yMin) / (box.yMax - box.yMin) * ctx.canvas.height));
    const coordinateTransferY = (y) => ((ctx.canvas.height - (y - box.yMin) / (box.yMax - box.yMin) * ctx.canvas.height));

    let transedXY = [];
    let nextXY = [];
    if (MainFileHeader.shapeType === shapeType.polygon) {
        MainFileRecord.forEach((record, idx) => {
            let curPosition = 0;
            const recordContent = record.recordContent;
            transedXY[idx] = [];
            nextXY[idx] = [];
            for (let i = 0; i < recordContent.numParts; i++) {
                const nextPart = (recordContent.numParts - 1 - i === 0) ? recordContent.numPoints : recordContent.parts[i + 1];
                transedXY[idx].push([coordinateTransferX(recordContent.points[curPosition].x), coordinateTransferY(recordContent.points[curPosition].y)]);
                curPosition += 1;
                nextXY[idx][i] = [];
                for (let j = curPosition; j < nextPart; j++) {
                    nextXY[idx][i].push([coordinateTransferX(recordContent.points[j].x), coordinateTransferY(recordContent.points[j].y)]);
                }
                curPosition = nextPart;
            }
        })
    }
    return [transedXY, nextXY];
}

const Canvas = props => {
    console.log("Canvas entry is okay!");
    const { MainFileHeader, MainFileRecord } = props
    const canvasRef = useRef(null);

    useEffect(() => {
        console.log("useEffect is okay!");
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 600;
        ctx.fillStyle = "rgb(153, 255, 51)";
        trackTransforms(ctx);

        const redraw = () => {
            const p1 = ctx.transformedPoint(0, 0);
            const p2 = ctx.transformedPoint(canvas.width, canvas.height);
            ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

            const [transedXY, nextXY] = getTransPos(MainFileHeader, MainFileRecord, ctx);

            MainFileRecord.forEach((record, idx) => {
                for (let i = 0; i < transedXY[idx].length; i++) {
                    ctx.beginPath();
                    // ctx.moveTo(transedXY[idx][i][0], transedXY[idx][i][1]);
                    for (let j = 0; j < nextXY[idx][i].length; j++) {
                        ctx.lineTo(nextXY[idx][i][j][0], nextXY[idx][i][j][1]);
                    }
                    ctx.fill();
                    ctx.stroke();
                }
            })
            requestAnimationFrame(redraw);
        }

        redraw();

        let lastX = canvas.width / 2, lastY = canvas.height / 2;
        let dragStart, dragged;
        canvas.onmousedown = (evt) => {
            document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
            lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
            lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
            dragStart = ctx.transformedPoint(lastX, lastY);
            dragged = false;
        };
        canvas.onmousemove = (evt) => {
            lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
            lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
            dragged = true;
            if (dragStart) {
                const pt = ctx.transformedPoint(lastX, lastY);
                ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
                // redraw();
            }
        };
        canvas.onmouseup = (evt) => {
            dragStart = null;
            if (!dragged) zoom(evt.shiftKey ? -1 : 1);
        };
        let scaleFactor = 1.1;
        const zoom = (clicks) => {
            let pt = ctx.transformedPoint(lastX, lastY);
            ctx.translate(pt.x, pt.y);
            let factor = Math.pow(scaleFactor, clicks);
            ctx.scale(factor, factor);
            ctx.translate(-pt.x, -pt.y);
            // redraw();
        }

        canvas.onmousewheel = (evt) => {
            const delta = evt.wheelDelta ? evt.wheelDelta / 100 : evt.detail ? -evt.detail : 0;
            console.log(delta);
            if (delta) {
                zoom(Math.round(delta));
            }
            return evt.preventDefault() && false;
        };
        // canvas.addEventListener('DOMMouseScroll', handleScroll, false);
        // canvas.addEventListener('mousewheel', handleScroll, false);
    }, [MainFileHeader, MainFileRecord]);

    return <canvas style={{backgroundColor: 'rgb(51, 153, 255)'}} width={window.innerWidth-200} height={window.innerHeight-200} ref={canvasRef} />
}

export default Canvas