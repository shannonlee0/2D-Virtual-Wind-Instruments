let dragging = false;
let moves = [];

canvas.addEventListener("keydown", function (event) {
    // restart
    if (event.code === "Enter") {
        scene.reset();
    }

    // undo
    if (event.code === "KeyZ" && moves.length > 0) {
        const pair = moves.pop();
        scene.drawAir(pair[0], pair[1]);
    }

    // play/pause
    if (event.code === "Space") {
        scene.play = !scene.play
    }
});

// create instrument geometry
canvas.addEventListener("mousedown", function (event) {
    console.log("mousedown");
    dragging = true;
    scene.drawInstrument(findCell()[0], findCell()[1]);
});

canvas.addEventListener("mousemove", function (event) {
    if (dragging) {
        scene.drawInstrument(findCell()[0], findCell()[1]);
    }
});

canvas.addEventListener("mouseup", function (event) {
    dragging = false;
});