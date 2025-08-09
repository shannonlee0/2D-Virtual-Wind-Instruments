function toClipCoords(val, axis) {
    // takes in pixel coordinates, converts to clip coordinates
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

function findCell(grid) {
    // returns the ij-coordinates of cell clicked
    const clipX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const clipY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);

    const i = upperGridIndex(clipY, grid);
    const j = lowerGridIndex(clipX, grid);

    return [i, j];
}

function lowerGridIndex(value, grid) {
    // returns array item "left" of value on number line
    // use to get i-coordinate of cell
    const arr = horizontalCoords(grid);
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

function upperGridIndex(value, grid) {
    // returns array item "above" value on number line
    // use to get j-coordinate of cell
    const arr = verticalCoords(grid);
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

function verticalCoords(grid) {
    // get vertical grid coordinate values
    const height = grid.height;
    let vCoords = [];
    const vIndent = (rect.bottom - rect.top) / height;
    for (let i = 0; i < height + 1; i++) {
        vCoords.push(toClipCoords(rect.top + vIndent * i, "y"));
    }
    return vCoords;
}

function horizontalCoords(grid) {
    // get horizontal grid coordinate values
    const width = grid.width;
    let hCoords = [];
    const hIndent = (rect.right - rect.left) / width;
    for (let i = 0; i < width + 1; i++) {
        hCoords.push(toClipCoords(rect.left + hIndent * i, "x"));
    }
    return hCoords;
}

function pressureToColor(pressure) {
    // pressure ∈ [-1, 1]
    if (pressure <= 0) {
        return [0, 0, -pressure];
    }
    return [pressure, 0, 0];
}

function getLabel(index, thickness) {
    // created as a helper to get damping values
    return (-1 * Math.abs(index - thickness)) + thickness;
}