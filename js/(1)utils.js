function toClipCoords(val, axis) {
    let clip;
    switch (axis) {
        case "x":
            clip = (val / rect.right) * 2 - 1;
            clip *= 1;
            break;
        case "y":
            clip = -((val / rect.bottom) * 2 - 1);
            break;
    }
    return clip;
}

function findCell() {
    const clipX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const clipY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);

    const i = upperGridIndex(clipY);
    const j = lowerGridIndex(clipX);

    return [i, j];
}

function lowerGridIndex(value) {
    // returns array item "left" of value on number line
    // use to get i-coordinate of cell
    const arr = horizontalCoords();
    let diff = 2;
    let lower = 0;
    for (let i = 0; i < arr.length; i++) {
        if (Math.abs(value - arr[i]) < diff && value - arr[i] > 0) {
            diff = Math.abs(value - arr[i]);
            lower = i;
        }
    }
    return lower;
}

function upperGridIndex(value) {
    // returns array item "above" value on number line
    // use to get j-coordinate of cell
    const arr = verticalCoords();
    let diff = 2;
    let lower = 0;
    for (let i = 0; i < arr.length; i++) {
        if (Math.abs(value - arr[i]) < diff && value - arr[i] < 0) {
            diff = Math.abs(value - arr[i]);
            lower = i;
        }
    }
    return lower;
}

function verticalCoords() {
    let vCoords = [];
    const vIndent = (rect.bottom - rect.top) / gridHeight;
    for (let i = 0; i < gridHeight + 1; i++) {
        vCoords.push(toClipCoords(rect.top + vIndent * i, "y"));
    }
    return vCoords;
}

function horizontalCoords() {
    let hCoords = [];
    const hIndent = (rect.right - rect.left) / gridWidth;
    for (let i = 0; i < gridWidth + 1; i++) {
        hCoords.push(toClipCoords(rect.left + hIndent * i, "x"));
    }
    return hCoords;
}

function pressureToColor(cellPressure) {
    // not normalized yet, pressure = beta rn
    beta = cellPressure;
    // blue = [0, 0, 1]
    // white = [1, 1, 1]
    // red = [1, 0, 0]
    // beta is normalized pressure value, -1 to 1
    // if beta is negative: [beta+1, beta+1, 1]
    // if beta is positive: [1, 1-beta, 1-beta]

    // if (beta <= 0) {
    //     return [beta + 1, beta + 1, 1];
    // }
    // return [1, 1 - beta, 1 - beta];

    // blue = [0, 0, 1]
    // black = [0, 0, 0]
    // red = [1, 0, 0]

    if (beta <= 0) {
        return [0, 0, -beta];
    }
    return [beta, 0, 0];
}

function getLabel(index, thickness) {
    return (-1 * Math.abs(index - thickness)) + thickness;
}