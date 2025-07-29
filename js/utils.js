function toClipCoords(val, axis) {
    const rect = canvas.getBoundingClientRect();
    let clip;
    switch (axis) {
        case "x":
            clip = (val / rect.right) * 2 - 1;
            break;
        case "y":
            clip = -((val / rect.bottom) * 2 - 1);
            break;
    }
    return clip;
}

function findCell(canvas, sim) {
    const rect = canvas.getBoundingClientRect();
    const clipX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const clipY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);

    const i = upperGridIndex(canvas, clipY);
    const j = lowerGridIndex(canvas, clipX);

    return [i, j];
}

function lowerGridIndex(canvas, value) {
    // returns array item "left" of value on number line
    // use to get i-coordinate of cell
    const arr = horizontalCoords(canvas);
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

function upperGridIndex(canvas, value) {
    // returns array item "above" value on number line
    // use to get j-coordinate of cell
    const arr = verticalCoords(canvas);
    let diff = 2;
    let upper = 0;
    for (let i = 0; i < arr.length; i++) {
        if (Math.abs(value - arr[i]) < diff && value - arr[i] < 0) {
            diff = Math.abs(value - arr[i]);
            lower = i;
        }
    }
    return lower;
}