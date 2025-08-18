let draggingInstrument = false;
let draggingMic = false;
let draggingSource = false;
let hatch = false;
let draggingToneholes = false;

let mouseI = 0;
let mouseJ = 0;
let length = 0;

const ampSlider = document.getElementById("ampSlider");
ampSlider.addEventListener("input", () => {
    amp = ampSlider.value;
})

const freqSlider = document.getElementById("freqSlider");
freqSlider.addEventListener("input", () => {
    freq = freqSlider.value;
})

const pmSlider = document.getElementById("pmSlider");
pmSlider.addEventListener("input", () => {
    pm = pmSlider.value;
    console.log("pm:", pm);
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
        scene.play = !scene.play;
    }

    // cross-hatch
    if (event.code == "KeyF") {
        hatch = !hatch;
    }

    // toggle toneholes
    if (event.code.startsWith("Digit")) {
        const num = parseInt(event.code.replace("Digit", ""), 10);
        if (num <= scene.toneholes.length) {
            scene.toggleTonehole(num);
        } 
    }
});

// create instrument geometry
canvas.addEventListener("mousedown", function (event) {
    if (event.shiftKey && scene.geometry[mouseI][mouseJ]) {
        draggingToneholes = true;
        scene.drawToneholes(mouseI, mouseJ);
        hole = {
            i: mouseI, 
            j: mouseJ,
            length: 0,
            open: false
        }
    }
    else if (mouseI == mic.i && mouseJ == mic.j) {
        console.log("mic contact");
        draggingMic = true;
    }
    else if (mouseI >= source.i && mouseI <= source.i + source.height && mouseJ == source.j) {
        console.log("source contact");
        draggingSource = true;
        
    }
    else {
        draggingInstrument = true;
        scene.drawInstrument(mouseI, mouseJ);
    }
});

canvas.addEventListener("mousemove", function (event) {
    mouseI = findCell(scene)[0];
    mouseJ = findCell(scene)[1];
    if (draggingMic) {
        mic = {
            i: mouseI,
            j: mouseJ
        }
    }
    else if (draggingSource) {
        source = {
            i: mouseI, 
            j: mouseJ,
            height: source.height
        }
    }
    else if (draggingInstrument) {
        scene.drawInstrument(mouseI, mouseJ);
    }
    else if (draggingToneholes) {
        scene.drawToneholes(mouseI, mouseJ);
        if (scene.geometry[mouseI][mouseJ]) {
            length = mouseJ - hole.j;
        }
    }
    else if (hatch) {
        scene.crossHatch(mouseI, mouseJ);
    }
});

canvas.addEventListener("mouseup", function (event) {
    draggingInstrument = false;
    draggingMic = false;
    draggingSource = false;

    if (draggingToneholes) {
        hole.length = length;
        scene.toneholes.push(hole);
        draggingToneholes = false;
        console.log(scene.toneholes);
    }
});