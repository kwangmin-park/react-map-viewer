const shapeType = {
    nullShape: 0,
    point: 1,
    multiPoint: 8,
    polyLine: 3,
    polygon: 5
};

function MainFileRecordParser (fileText, length) {
    let position = 100;
    const record = [];

    const RecordHeaderParsing = () => {
        const recordHeader = {
            recordNumber: fileText.getInt32(position),
            contentLength: fileText.getInt32(position + 4)
        };
        position += 8;
        return recordHeader;
    }

    const RecordContentParsing = () => {
        let recordContent = {};
        const recordShapeType = fileText.getInt32(position, true);

        switch(recordShapeType) {
            case shapeType.nullShape:
                console.log(NullShape());
                break;
            case shapeType.point:
                recordContent.shapeType = shapeType.point;
                position += 4;
                recordContent = Point();
                break;
            case shapeType.multiPoint:
                recordContent = MultiPoint();
                break;
            case shapeType.polyLine:
                recordContent = PolyLine();
                break;
            case shapeType.polygon:
                recordContent = Polygon();
        }

        return recordContent;
    }

    const NullShape = () => {
        return 0;
    }

    const Point = () => {
        const content = {
            x: fileText.getFloat64(position, true),
            y: fileText.getFloat64(position + 8, true)
        };
        position += 16;
        return content;
    }

    const MultiPoint = () => {
        const content = {};
        content.shapeType = 8;
        content.box = {
            xMin: fileText.getFloat64(position + 4, true),
            yMin: fileText.getFloat64(position + 12, true),
            xMax: fileText.getFloat64(position + 20, true),
            yMax: fileText.getFloat64(position + 28, true),
        };
        content.numPoints = fileText.getInt32(position + 36, true);
        position += 40;
        content.points = [];
        for(let i = 0; i < content.numPoints; i++) {
            content.points.push(Point());
        }
        return content;
    }

    const PolyLine = () => {
        const content = {};
        content.shapeType = 3;
        content.box = {
            xMin: fileText.getFloat64(position + 4, true),
            yMin: fileText.getFloat64(position + 12, true),
            xMax: fileText.getFloat64(position + 20, true),
            yMax: fileText.getFloat64(position + 28, true),
        };
        content.numParts = fileText.getInt32(position + 36, true);
        content.numPoints = fileText.getInt32(position + 40, true);

        content.parts = [];
        for(let i = 0; i < content.numParts; i++) {
            content.parts.push(fileText.getInt32(position + 44 + 4 * i, true));
        }
        content.points = [];
        position += 44 + content.numParts * 4;
        for(let i = 0; i < content.numPoints; i++) {
            content.points.push(Point());
        }
        return content;
    }

    const Polygon = () => {
        const content = {
            box: {
                xMin: fileText.getFloat64(position + 4, true),
                yMin: fileText.getFloat64(position + 12, true),
                xMax: fileText.getFloat64(position + 20, true),
                yMax: fileText.getFloat64(position + 28, true),
            },
            numParts: fileText.getInt32(position + 36, true),
            numPoints: fileText.getInt32(position + 40, true),
        };
        content.shapeType = 5;
        content.parts = [];
        for(let i = 0; i < content.numParts; i++) {
            content.parts.push(fileText.getInt32(position + 44 + 4 * i, true));
        }
        content.points = [];
        position += 44 + content.numParts * 4;
        for(let i = 0; i < content.numPoints; i++) {
            content.points.push(Point());
        }
        return content;
    }

    while(position < length * 2) {
        let tempRecord= {
            recordHeader: RecordHeaderParsing(),
            recordContent: RecordContentParsing()
        };

        record.push(tempRecord);
    }

    return record;
}

export default MainFileRecordParser;