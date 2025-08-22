let amp = 1;
let freq = 440;
let pm = 3000;

// re-render every n = numSteps steps
const numSteps = 200;
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
    j: Math.trunc(gridWidth / 4),
    height: 3
}

// microphone location
let mic = {
    i: Math.trunc((source.i + source.height) / 1.5),
    j: Math.trunc(source.j + 100)
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

            // step values
            // note: put source application after stepping the value to be overwritten
            scene.stepPressure();
            scene.stepVelocity();
            scene.applyClarinet(source.i, source.j);
            
            // get microphone values
            let value = scene.p[mic.i][mic.j]
            micValues.push(value);
            scene.frame++
        }
    }

    // writeMicValues(20000);
}

function update() {
    simulate();

    // update colors before draw
    scene.mapPressure();

    // for testing purposes
    if (visualizePML) {
        console.log("hhhf");
        scene.mapPML();
    }
    
    // anything that should be colored atop pressure mapping
    scene.colorConstants(mic, source, scene.toneholes);

    draw();
    if (scene.play) {
        console.log("damping", scene.damping);
    }
    
    canvas.focus();
    requestAnimationFrame(update);
}

function clarinet() {
    // hard coding geometry
    // bore
    const boreLength = 70;
    for (let j = 0; j < boreLength; j++) {
        scene.drawInstrument(source.i - 1, source.j + j);
        scene.drawInstrument(source.i + source.height, source.j + j);

        if (j > 5) {
            //scene.drawInstrument(source.i - 2, source.j + j);
            //scene.drawInstrument(source.i + source.height + 1, source.j + j);
        }
    }
    // bell
    const bellLength = 5;
    // displacement from bore wall vs distance from end of bore
    const bellValues = [1, 1, 1, 2, 3]
    for (let j = 0; j < bellLength; j++) {
        //scene.drawInstrument(source.i - 1 - bellValues[j], source.j + boreLength + j);
        //scene.drawInstrument(source.i + source.height + bellValues[j], source.j + boreLength + j);
    }
    //scene.drawAir(source.i - 1, source.j + 53);
    //scene.drawAir(source.i - 1, source.j + 54);
}