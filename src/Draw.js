import zooming, { cameraZoom,cameraOffset } from './user_interface/Zooming.js';

const shapeType = {
    polygon: 5
}

const draw = (ctx, canvas, MainFileHeader, MainFileRecord) => {
    // ctx.translate(window.innerWidth/2, window.innerHeight/2);
    // ctx.translate( -window.innerWidth / 2 + cameraOffset.x, -window.innerHeight / 2 + cameraOffset.y )

    const shapeType = {
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

    if(MainFileHeader.shapeType === shapeType.polygon) {
        ctx.scale(cameraZoom, cameraZoom);
        MainFileRecord.forEach(record => {
            let curPosition = 0;
            const recordContent = record.recordContent;
            for(let i = 0; i < recordContent.numParts; i++) {
                const nextPart = (recordContent.numParts - 1 - i === 0) ? recordContent.numPoints : recordContent.parts[i + 1];
                ctx.fillStyle = "rgb(153, 255, 51)";
                ctx.beginPath();
                const transedX = coordinateTransferX(recordContent.points[curPosition].x);
                const transedY = coordinateTransferY(recordContent.points[curPosition].y);
                ctx.moveTo(transedX, transedY);
                curPosition += 1;
                for(let j = curPosition; j < nextPart; j++) {
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

export default draw;