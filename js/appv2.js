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

var InitDemo = function () {
    const canvas = document.getElementById("game-surface")
    const gl = getWebGL(canvas);


    const rect = canvas.getBoundingClientRect();
    const dx = (rect.right - rect.left) / gridWidth;
    const dy = (rect.bottom - rect.top) / gridHeight;

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const program = setup(gl);
    const buffer = gl.createBuffer();
    const vertices = calculateGridVertices(verticalCoords(canvas), horizontalCoords(canvas));
    let grid = initializeGrid(vertices);
    let geometry = initializeGeometry();

    console.log("grid: ", grid);
    console.log("geometry: ", geometry);
    initializeSimulation(grid, dx, dy);
    render();

    trackEvents(canvas, grid, geometry, vertices, function (...args) {
        if (args.length === 0) {
            render();
        }
        if (args.length === 2) {
            grid = args[0];
            geometry = args[1];
            render();
        }
    });

    function render() {
        for (let i = 0; i < gridHeight; i++) {
            for (let j = 0; j < gridWidth; j++) {
                gl.useProgram(program);
                drawCell(gl, program, grid[i][j], buffer);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        }
    }

}



function stepPressure(p, vx, vy, dx) {
    for (let i = 1; i < gridHeight - 1; i++) {
        for (let j = 1; j < gridWidth - 1; j++) {
            div_v = (vx[i + 1][j] - vx[i][j] + vy[i][j + 1] - vy[i][j]) / dx
            p[i][j] = ((-RHO * C * C * div_v * dt) + p[i][j])
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

function initializeSimulation(grid, dx, dy) {
    // initialize pressure, velocity grids
    let p = [];
    let vx = [];
    let vy = [];
    for (let i = 0; i < gridHeight; i++) {
        p[i] = [];
        vx[i] = [];
        vy[i] = [];
        for (let j = 0; j < gridWidth; j++) {
            p[i][j] = 0;
            vx[i][j] = 0;
            vy[i][j] = 0;
        }
    }
    console.log("p: ", p);
    console.log("vx: ", vx);
    console.log("vy: ", vy);

    // initial condition
    p[gridHeight / 2][gridWidth / 2] = 1;
    p[2][2] = -1;
    mapPressure(grid, p);

    for (let i = 0; i < 10; i++) {
        update(grid, p, vx, vy, dx);
    }
}

function update(grid, p, vx, vy, dx) {
    stepVelocity(p, vx, vy, dx);
    stepPressure(p, vx, vy, dx);

    mapPressure(grid, p);
    console.log("up");
}



function mapPressure(grid, p) {
    for (let i = 1; i < gridHeight - 1; i++) {
        for (let j = 1; j < gridWidth - 1; j++) {
            colorCell(grid, i, j, pressureToColor(p[i][j]));
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

function horizontalCoords(canvas) {
    const rect = canvas.getBoundingClientRect();

    let hCoords = [];
    const hIndent = (rect.right - rect.left) / gridWidth;
    for (let i = 0; i < gridWidth + 1; i++) {
        hCoords.push(toClipCoords(rect.left + hIndent * i, canvas, "x"));
    }
    return hCoords;
}

function verticalCoords(canvas) {
    const rect = canvas.getBoundingClientRect();

    let vCoords = [];
    const vIndent = (rect.bottom - rect.top) / gridHeight;
    for (let i = 0; i < gridHeight + 1; i++) {
        vCoords.push(toClipCoords(rect.top + vIndent * i, canvas, "y"));
    }
    return vCoords;
}

function calculateGridVertices(vCoords, hCoords) {
    let triangle = [];
    let topTriangleVertices = [];
    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
            triangle = [hCoords[j], vCoords[i], hCoords[j + 1], vCoords[i], hCoords[j], vCoords[i + 1]];
            topTriangleVertices.push(...triangle);
        }
    }

    let bottomTriangleVertices = [];
    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
            triangle = [hCoords[j + 1], vCoords[i], hCoords[j], vCoords[i + 1], hCoords[j + 1], vCoords[i + 1]];
            bottomTriangleVertices.push(...triangle);
        }
    }

    // combine top and bottom: first 6 is top triangle coords, next 6 is bottom triangle coords, etc.
    let vertices = [];
    for (let i = 0; i < topTriangleVertices.length + bottomTriangleVertices.length; i++) {
        vertices.push(...topTriangleVertices.slice(6 * i, 6 * i + 6));
        vertices.push(...bottomTriangleVertices.slice(6 * i, 6 * i + 6));
    }
    return vertices;
}

function initializeGrid(vertices) {
    let grid = [];
    for (let i = 0; i < gridHeight; i++) {
        grid[i] = [];
        for (let j = 0; j < gridWidth; j++) {
            // each cell's vertices described in chunks of 12
            grid[i][j] = vertices.slice(12 * (gridWidth * i + j), 12 * (gridWidth * i + j) + 12);
            // default color is black
            const color = [0, 0, 0];
            for (let n = 6; n > 0; n--) {
                grid[i][j].splice(n * 2, 0, color[0], color[1], color[2]);
            }
        }
    }
    return grid;
}

function initializeGeometry() {
    // 2d array of booleans: true indicates solid cell, false indicates air cell
    let geometry = [];
    for (let i = 0; i < gridHeight; i++) {
        geometry[i] = [];
        for (let j = 0; j < gridWidth; j++) {
            geometry[i][j] = false;
        }
    }
    return geometry;
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

function trackEvents(canvas, grid, geometry, vertices, callback) {
    let dragging = false;
    let moves = [];

    const colors = [[1.0, 0, 0], [0, 1.0, 0], [0, 0, 1.0]];
    let color = 0;

    canvas.tabIndex = 0;
    canvas.focus();
    canvas.addEventListener("keydown", function (event) {
        if (event.code === "KeyR") {
            color = (color + 1) % colors.length;
            colorCell(grid, 1, 1, colors[color]);
            callback();
        }

        // restart
        if (event.code === "Enter") {
            console.log("return pressed");
            const newGrid = initializeGrid(vertices);
            const newGeometry = initializeGeometry();
            grid = newGrid;
            geometry = newGeometry;
            console.log(grid);
            console.log(geometry);
            callback(grid, geometry);
        }

        // undo
        if (event.code === "KeyZ" && moves.length > 0) {
            const pair = moves.pop();
            drawAir(canvas, grid, geometry, pair[0], pair[1]);
            callback();
        }
    });

    // create instrument geometry
    canvas.addEventListener("mousedown", function (event) {
        dragging = true;
        drawInstrument(canvas, grid, geometry, moves);
        callback();
    });

    canvas.addEventListener("mousemove", function (event) {
        if (dragging) {
            drawInstrument(canvas, grid, geometry, moves);
            callback();
        }
    });

    canvas.addEventListener("mouseup", function (event) {
        dragging = false;
        console.log("moves: ", moves);
    });
}

function drawInstrument(canvas, grid, geometry, moves) {
    const rect = canvas.getBoundingClientRect();
    const clipX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const clipY = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);

    const i = upperGridIndex(canvas, clipY);
    const j = lowerGridIndex(canvas, clipX);

    const white = [1, 1, 1]
    colorCell(grid, i, j, white)
    geometry[i][j] = true;

    if (moves.length == 0 || moves[moves.length - 1][0] != i || moves[moves.length - 1][1] != j) {
        moves.push([i, j]);
    }
}

function drawAir(canvas, grid, geometry, i, j) {
    const black = [0, 0, 0]
    colorCell(grid, i, j, black)
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