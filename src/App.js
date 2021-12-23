import React, { useState } from 'react'
import Canvas from './Canvas.js';
import MainFileHeaderParser from './parser/MainFileHeaderParser';
import MainFileRecordParser from "./parser/MainFileRecordParser";

const App = () =>  {
    const [ mainFileHeader, setMainFileHeader ] = useState({});
    const [ mainFileRecord, setMainFileRecord ] = useState([]);

    const onChange = (e) => {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(e.target.files[0]);
        fileReader.onload = function(e) {
            const view = new DataView(e.target.result);
            const mainFileHeader = MainFileHeaderParser(view);
            const record = MainFileRecordParser(view, mainFileHeader.fileLength);
            setMainFileHeader(mainFileHeader);
            setMainFileRecord(record);
        }
    }

    return (
        <div>
            <div className="Input">
                <input type='file' onChange={onChange}/>
            </div>
            <hr />
            <div>
                <Canvas MainFileHeader={mainFileHeader} MainFileRecord={mainFileRecord} />
            </div>
        </div>
    );
}

export default App;