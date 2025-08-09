let amp = 1;
let freq = 440;

// re-render every n = numSteps steps
const numSteps = 100;
let micValues = [];

const canvas = document.getElementById("simulation-surface");
canvas.tabIndex = 0;
canvas.focus();

const rect = canvas.getBoundingClientRect();
const gl = getWebGL(canvas);
    
let scene = new Grid(gridHeight, gridWidth);


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
            // apply source
            scene.p[source.i][source.j] = amp * Math.sin(scene.frame * dt * (2*Math.PI) * freq);
            
            // step pressure and velocity
            scene.step();

            // get microphone values
            let value = scene.p[mic.i][mic.j]
            micValues.push(value);
        }
    }

    // length of micValues .txt file
    const length = 80000
    if (scene.frame == length) {
        const text = (1 / dt) + "\n" + micValues.join("\n");
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "micValues.txt";
        link.click();
    }
}

function update() {
    simulate();

    // update colors before draw
    scene.mapPressure();
    const green = [0, 255, 0];
    const yellow = [255, 50, 0];
    scene.colorCell(mic.i, mic.j, green);
    scene.colorCell(source.i, source.j, yellow);

    draw();

    if (scene.play) {
        console.log("frame:", scene.frame);
    }
    canvas.focus();

    requestAnimationFrame(update);
}