let draggingInstrument = false;
let draggingMic = false;
let draggingSource = false;

let moves = [];

const ampSlider = document.getElementById("ampSlider");
ampSlider.addEventListener("input", () => {
    amp = ampSlider.value;
})

const freqSlider = document.getElementById("freqSlider");
freqSlider.addEventListener("input", () => {
    freq = freqSlider.value;
})

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
    const [i, j] = [findCell(scene)[0], findCell(scene)[1]];
    if (i == mic.i && j == mic.j) {
        console.log("mic contact");
        draggingMic = true;
    }
    else if (i == source.i && j == source.j) {
        console.log("source contact");
        draggingSource = true;
        
    }
    else {
        draggingInstrument = true;
        scene.drawInstrument(i, j);
    }
});

canvas.addEventListener("mousemove", function (event) {
    const [i, j] = [findCell(scene)[0], findCell(scene)[1]];
    if (draggingMic) {
        mic = {
            i: i,
            j: j
        }
    }
    else if (draggingSource) {
        source = {
            i: i, 
            j: j
        }
    }
    else if (draggingInstrument) {
        scene.drawInstrument(i, j);
    }
});

canvas.addEventListener("mouseup", function (event) {
    draggingInstrument = false;
    draggingMic = false;
    draggingSource = false;
});