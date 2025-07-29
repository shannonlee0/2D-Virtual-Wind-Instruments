let dragging = false;
let moves = [];

function findCell(canvas, sim) {
    const rect = canvas.getBoundingClientRect();
    const clipX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const clipY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);

    const i = upperGridIndex(canvas, clipY);
    const j = lowerGridIndex(canvas, clipX);

    return [i, j];
}

function lowerGridIndex(canvas, clicked) {
    // returns array item "left" of value on number line
    // use to get i-coordinate of cell
    const arr = horizontalCoords(canvas);
    let diff = 2;
    let lower = 0;
    for (let i = 0; i < arr.length; i++) {
        if (Math.abs(clicked - arr[i]) < diff && clicked - arr[i] > 0) {
            diff = Math.abs(clicked - arr[i]);
            lower = i;
        }
    }
    return lower;
}

function upperGridIndex(canvas, clicked) {
    // returns array item "above" value on number line
    // use to get j-coordinate of cell
    const arr = verticalCoords(canvas);
    let diff = 2;
    let upper = 0;
    for (let i = 0; i < arr.length; i++) {
        if (Math.abs(clicked - arr[i]) < diff && clicked - arr[i] < 0) {
            diff = Math.abs(clicked - arr[i]);
            lower = i;
        }
    }
    return lower;
}

canvas.addEventListener("keydown", function (event) {
        // restart
        if (event.code === "Enter") {
            console.log("return pressed");
            const newSim = new Grid(canvas);
            sim = newSim;
            console.log(sim);
            //callback(grid, geometry);
            console.log("enter");
        }

        // undo
        if (event.code === "KeyZ" && moves.length > 0) {
            const pair = moves.pop();
            drawAir(canvas, sim, pair[0], pair[1]);
            callback();
        }
    });

// create instrument geometry
canvas.addEventListener("mousedown", function (event) {
    dragging = true;
    sim.drawInstrument(sim, moves, findCell[0], findCell[1]);
    callback();
});

canvas.addEventListener("mousemove", function (event) {
    if (dragging) {
        drawInstrument(canvas, sim, moves);
        callback();
    }
});

canvas.addEventListener("mouseup", function (event) {
    dragging = false;
    console.log("moves: ", moves);
});