function MainFileHeaderParser(fileText) {
    const header = {
        fileCode: fileText.getInt32(0),
        fileLength: fileText.getInt32(24), // byte
        fileVersion: fileText.getInt32(28, true),
        shapeType: fileText.getInt32(32, true),
        xMin: fileText.getFloat64(36, true),
        yMin: fileText.getFloat64(44, true),
        xMax: fileText.getFloat64(52, true),
        yMax: fileText.getFloat64(60, true),
        zMin: fileText.getFloat64(68, true),
        zMax: fileText.getFloat64(76, true),
        mMin: fileText.getFloat64(84, true),
        mMax: fileText.getFloat64(92, true),
    };

    return header;
}

export default MainFileHeaderParser;