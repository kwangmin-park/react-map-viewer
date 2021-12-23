let cameraZoom = 1;
let cameraOffset = { x: window.innerWidth/2, y: window.innerHeight/2 };

const zooming = (ctx, canvas, MainFileHeader, MainFileRecord) => {
    let MAX_ZOOM = 5;
    let MIN_ZOOM = 0.1;
    let SCROLL_SENSITIVITY = 0.0005;

    function draw() {
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

        requestAnimationFrame(draw);
    }

    // Gets the relevant location from a mouse or single touch event
    function getEventLocation(e) {
        // e.touches: A TouchList of all the Touch objects representing all current points of contact with the surface,
        // regardless of target or changed status.
        if(e.touches && e.touches.length == 1) { // the number of touch events
            console.log("getEventLocationMove: ", e.touches[0].clientX, e.touches[0].clientY);
            return { x: e.touches[0].clientX, y: e.touches[0].clientY }; // return the x- and y-coordinates of the touch
        }
        // 이벤트가 발생한 애플리케이션(viewport) 내 x-, y- 좌표 제공
        else if(e.clientX && e.clientY) {
            console.log("getEventLocationClick: ", e.clientX, e.clientY);
            return {x: e.clientX, y: e.clientY }; // Output the coordinates of the mouse pointer when the mouse button is cliked on an element
        }
    }

    let isDragging = false;
    let dragStart = { x: 0, y: 0 };

    function onPointerDown(e) {
        isDragging = true;
        dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x;
        dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y;
        console.log("onPointerDown: ", dragStart);
    }

    function onPointerUp(e) {
        console.log("onpointerup!");
        isDragging = true;
        initialPinchDistance = null;
        lastZoom = cameraZoom;
    }

    function onPointerMove(e) {
        console.log("onpointermove!");
        if(isDragging) {
            cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x;
            cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y;
        }
    }

    function handleTouch(e, singleTouchHandler) {
        console.log("handletouch!");
        if(e.touches.length == 1) {
            singleTouchHandler(e);
        }
        else if (e.type === "touchmove" && e.touches.length == 2) {
            isDragging = false;
            handlePinch(e);
        }
    }

    let initialPinchDistance = null;
    let lastZoom = cameraZoom;

    function handlePinch(e) {
        console.log("handlepinch!");
        e.preventDefault();

        let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };

        // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
        let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2;

        if(initialPinchDistance == null) {
            initialPinchDistance = currentDistance;
        }
        else {
            adjustZoom( null, currentDistance/initialPinchDistance );
        }
    }

    function adjustZoom(zoomAmount, zoomFactor) {
        if(!isDragging) {
            console.log("adjstzoom!");
            if(zoomAmount) {
                cameraZoom += zoomAmount;
            }
            else if(zoomFactor) {
                console.log(zoomFactor);
                cameraZoom = zoomFactor*lastZoom;
            }

            cameraZoom = Math.min( cameraZoom, MAX_ZOOM );
            cameraZoom = Math.max(cameraZoom, MIN_ZOOM);

            console.log(cameraZoom);
        }
    }

    // When I click, it goes to on mousedown -> mouseup. Because When mouse is clicked, we cannot use poiner for a while.
    console.log("zooming works!");
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown)); // touchstart: 손가락을 화면에 닿는 순간발생
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchend', (e) => handleTouch(e, onPointerUp)); // touchend: 손가락을 화면에서 떼는 순간 발생
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove));
    canvas.addEventListener('wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY));

    draw();
}

export default zooming;
export { cameraZoom, cameraOffset };