let amp = 1;
let freq = 440;
let pm = 3000;

// re-render every n = numSteps steps
const numSteps = 100;
let micValues = [];

const canvas = document.getElementById("simulation-surface");
canvas.tabIndex = 0;
canvas.focus();

const rect = canvas.getBoundingClientRect();
const gl = getWebGL(canvas);
    
let scene = new Grid(gridHeight, gridWidth);

// source location (top)
let source = {
    i: Math.trunc(gridHeight / 2),
    j: Math.trunc(gridWidth / 4) + 1,
    height: 10
}

// microphone location
let mic = {
    i: Math.trunc(source.i),
    j: Math.trunc(source.j + 79)
}

function getWebGL(canvas) {
    var gl = canvas.getContext('webgl');

    if (!gl) {
        console.log("webGL not supported, so experimental");
        gl = canvas.getContext('experimental-webgl')
    }

    if (!gl) {
        alert('browser doesnt support webgl');
    }
    return gl;
}

function simulate() {
    if (scene.play) {
        for (let i = 0; i < numSteps; i++) {
            scene.getDamping(pmlThicknessInstrument);

            // step values
            // note: put source application after stepping the value to be overwritten
            scene.applyClarinet(source.i, source.j);
            scene.stepPressure();
            
            scene.stepVelocity();
            
            
            // get microphone values
            let value = scene.p[mic.i][mic.j]
            micValues.push(value);
            scene.frame++
        }
    }

    writeMicValues(4000);
}

function update() {
    simulate();

    // update colors before draw
    scene.mapPressure();
    scene.colorConstants(mic, source);

    draw();

    if (scene.play) {
        console.log("frame:", scene.frame);
    }
    
    canvas.focus();
    requestAnimationFrame(update);
}

function clarinet() {
    // hard coding geometry
    // bore
    for (let j = 0; j < 80; j++) {
        scene.drawInstrument(source.i - 1, source.j + j);
        scene.drawInstrument(source.i + source.height, source.j + j);
    }
}
