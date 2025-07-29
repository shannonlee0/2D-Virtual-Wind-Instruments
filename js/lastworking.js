var vertexShaderText =
    [
        'precision mediump float;',
        '',
        'attribute vec2 vertPosition;',
        'attribute vec3 vertColor;',
        // a "varying" variable is written in vertex shader, read in fragment shader, and is interpolated across the surface of a triangle
        // i.e. passes interpolated data from vertex to fragment shader
        'varying vec3 fragColor;',
        '',
        'void main()',
        '{',
        '   fragColor = vertColor;',
        // gl_Position is built-in variable in vertex shader, uses clip space coordinates
        // after setting, GPU converts from clip space to normalized device coordinates and maps to 2d screen
        '   gl_Position = vec4(vertPosition, 0.0, 1.0);',
        '}'
    ].join('\n');
var fragmentShaderText =
    [
        'precision mediump float;',
        '',
        // fragColor must match declaration in vertexShaderText
        'varying vec3 fragColor;',
        'void main()',
        '{',
        // gl_FragColor is built-in variable in fragment shader, tells GPU what color current fragment (pixel) should be on screen
        // (R, G, B, opacity)
        // '   gl_FragColor = vec4(fragColor, 1.0);',
        '   gl_FragColor = vec4(fragColor, 1.0);',
        '}'
    ].join('\n');

const gridHeight = 40;
const gridWidth = 40;

const C = 343.2
const RHO = 1.2


const dt = 1 / 100;

// class Grid {
//     constructor(canvas) {
//         // initialize empty grid
//         const gridVertices = calculateGridVertices(verticalCoords(canvas), horizontalCoords(canvas));
//         let grid = initializeGrid(gridVertices);

//         // initialize pressure and velocity values
//         let values = initializeGridValues();

//         // get dx, dy
//         // right now, dx and dy are the same (square canvas)
//         const dx = horizontalCoords(canvas)[1] - horizontalCoords(canvas)[0];

//         // initialize geometry
//         let geometry = initializeGeometry();

//         this.grid = grid;
//         this.geometry = geometry;
//         this.p = values["pressure"];
//         this.vx = values["velocityX"];
//         this.vy = values["velocityY"];
//         this.dx = dx;
//     }
// }

var InitDemo = function () {
    const canvas = document.getElementById("game-surface")
    const gl = getWebGL(canvas);
    
    const sim = new Grid(canvas);
    console.log("grid", sim.grid);
    console.log("p", sim.p);
    console.log("vx", sim.vx);
    console.log("vy", sim.vy);
    console.log("dx", sim.dx);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const program = setup(gl);
    const buffer = gl.createBuffer();

    render();

    trackEvents(canvas, sim, function (...args) {
        if (args.length === 0) {
            render();
        }
        if (args.length === 2) {
            sim.grid = args[0];
            geometry = args[1];
            render();
        }
    });

    function render() {
        for (let i = 0; i < sim.height; i++) {
            for (let j = 0; j < sim.width; j++) {
                gl.useProgram(program);
                drawCell(gl, program, sim.grid[i][j], buffer);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        }
    }

}

function stepPressure(sim) {
    for (let i = 1; i < gridHeight - 1; i++) {
        for (let j = 1; j < gridWidth - 1; j++) {
            div_v = (sim.vx[i + 1][j] - sim.vx[i][j] + sim.vy[i][j + 1] - sim.vy[i][j]) / sim.dx
            sim.p[i][j] = ((-RHO * C * C * div_v * dt) + p[i][j])
        }
    }
}

function stepVelocity(p, vx, vy, dx) {
    for (let i = 1; i < gridHeight - 1; i++) {
        for (let j = 1; j < gridWidth - 1; j++) {
            grad_p_x = (p[i][j] - p[i-1][j]) / dx
            grad_p_y = (p[i][j] - p[i][j-1]) / dx

            vx[i][j] = (-1 / RHO * dt * grad_p_x + vx[i][j])
            vy[i][j] = (-1 / RHO * dt * grad_p_y + vy[i][j])
        }
    }
}


function update(grid, p, vx, vy, dx) {
    stepVelocity(p, vx, vy, dx);
    stepPressure(p, vx, vy, dx);

    mapPressure(grid, p);
    console.log("up");
}



function mapPressure(sim) {
    for (let i = 1; i < gridHeight - 1; i++) {
        for (let j = 1; j < gridWidth - 1; j++) {
            colorCell(sim.grid, i, j, pressureToColor(sim.p[i][j]));
        }
    }

    // not normalized yet, pressure = beta rn

    function pressureToColor(beta) {
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
        // white = [0, 0, 0]
        // red = [1, 0, 0]

        if (beta <= 0) {
            return [0, 0, -beta];
        }
        return [beta, 0, 0];
    }
}



function setup(gl) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    // compile shaders from code above
    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    // error checking, errors may not be apparent if simply run
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('error compiling vertex shader', gl.getShaderInfoLog(vertexShader));
        return;
    }
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('error compiling fragment shader', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    //
    // vertex and fragment shader now ready to use
    //

    // program is a linked pair of shaders (vertex, fragment) that runs on GPU
    // tell webgl these are the shaders we want to use together
    const program = gl.createProgram();

    // webgl remembers that vertexShader is a vertex shader, etc. so matches automatically
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader)

    // from program takes attached shaders, links them into a complete GPU pipeline
    gl.linkProgram(program);

    // error checking
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('error linking program', gl.getProgramInfoLog(program));
        return;
    }

    // catches additional errors in linked shader program (only do in testing, bc costly)
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('error validating program', gl.getProgramInfoLog(program));
        return;
    }

    return program;
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

function drawCell(gl, program, vertices, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    const colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

    gl.vertexAttribPointer(
        positionAttribLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        0
    );

    gl.vertexAttribPointer(
        colorAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        2 * Float32Array.BYTES_PER_ELEMENT,
    )

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(colorAttribLocation);
}

function colorCell(grid, i, j, color) {
    for (let n = 0; n < 6; n++) {
        grid[i][j].splice(n * 5 + 2, 3, color[0], color[1], color[2]);
    }
}

function trackEvents(canvas, sim, callback) {
    let dragging = false;
    let moves = [];

    const colors = [[1.0, 0, 0], [0, 1.0, 0], [0, 0, 1.0]];
    let color = 0;

    canvas.tabIndex = 0;
    canvas.focus();
    canvas.addEventListener("keydown", function (event) {
        if (event.code === "KeyR") {
            color = (color + 1) % colors.length;
            colorCell(sim.grid, 1, 1, colors[color]);
            callback();
        }

        // restart
        if (event.code === "Enter") {
            console.log("return pressed");
            const newSim = new Grid(canvas);
            sim = newSim;
            console.log(sim);
            callback(grid, geometry);
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
        drawInstrument(sim.grid, moves, findCell(canvas, sim)[0], findCell(canvas, sim)[1]);
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
}

function drawInstrument(grid, moves, i, j) {

    const white = [1, 1, 1];
    colorCell(grid, i, j, white);
    geometry[i][j] = true;

    if (moves.length == 0 || moves[moves.length - 1][0] != i || moves[moves.length - 1][1] != j) {
        moves.push([i, j]);
    }
}

function drawAir(sim, i, j) {
    const black = [0, 0, 0]
    colorCell(sim.grid, i, j, black)
    geometry[i][j] = false;
}

function toClipCoords(val, canvas, axis) {
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