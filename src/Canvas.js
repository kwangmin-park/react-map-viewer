import React, { useRef, useEffect } from 'react';
import zooming from './user_interface/Zooming.js';
import draw from './Draw.js';

const Canvas = props => {
    console.log("Canvas entry is okay!");
    const { MainFileHeader, MainFileRecord } = props
    const canvasRef = useRef(null);

    useEffect(() => {
        console.log("useEffect is okay!");
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        zooming(context, canvas, MainFileHeader, MainFileRecord);
    }, [MainFileHeader, MainFileRecord]);

    return <canvas style={{backgroundColor: 'rgb(51, 153, 255)'}} width={window.innerWidth-200} height={window.innerHeight-200} ref={canvasRef} />
}

export default Canvas