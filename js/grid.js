gridHeight = 20
gridWidth = 20

class Grid {
    constructor(canvas) {
        // initialize empty grid
        const gridVertices = calculateGridVertices(verticalCoords(canvas), horizontalCoords(canvas));
        let grid = initializeGrid(gridVertices);

        // initialize pressure and velocity values
        let values = initializeGridValues();

        // get dx, dy
        // right now, dx and dy are the same (square canvas)
        const dx = horizontalCoords(canvas)[1] - horizontalCoords(canvas)[0];

        // initialize geometry
        let geometry = initializeGeometry();

        this.grid = grid;
        
        this.geometry = geometry;
        this.p = values["pressure"];
        this.vx = values["velocityX"];
        this.vy = values["velocityY"];
        this.dx = dx;
    }

    stepPressure() {
        for (let i = 1; i < gridHeight - 1; i++) {
            for (let j = 1; j < gridWidth - 1; j++) {
                div_v = (this.vx[i + 1][j] - this.vx[i][j] + this.vy[i][j + 1] - this.vy[i][j]) / this.dx
                this.p[i][j] = ((-RHO * C * C * div_v * dt) + p[i][j])
            }
        }

    }

    stepVelocity() {
        // need to define dt
        for (let i = 1; i < gridHeight - 1; i++) {
            for (let j = 1; j < gridWidth - 1; j++) {
                grad_p_x = (this.p[i][j] - this.p[i-1][j]) / dx
                grad_p_y = (this.p[i][j] - this.p[i][j-1]) / dx

                this.vx[i][j] = (-1 / RHO * dt * grad_p_x + this.vx[i][j])
                this.vy[i][j] = (-1 / RHO * dt * grad_p_y + this.vy[i][j])
            }
        }
    }

    mapPressure() {
        for (let i = 1; i < gridHeight - 1; i++) {
            for (let j = 1; j < gridWidth - 1; j++) {
                colorCell(this.grid, i, j, pressureToColor(this.p[i][j]));
            }
        }
    }

    pressureToColor(cellPressure) {
        // not normalized yet, pressure = beta rn
        beta = cellPressure
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

    

    drawInstrument(i, j) {
        const white = [1, 1, 1];
        
        colorCell(this.grid, i, j, white);
        geometry[i][j] = true;

        if (moves.length == 0 || moves[moves.length - 1][0] != i || moves[moves.length - 1][1] != j) {
            moves.push([i, j]);
        }
    }

    drawAir(sim, i, j) {
        const black = [0, 0, 0]
        colorCell(sim.grid, i, j, black)
        geometry[i][j] = false;
    }
}

function colorCell(grid, i, j, color) {
    for (let n = 0; n < 6; n++) {
        grid[i][j].splice(n * 5 + 2, 3, color[0], color[1], color[2]);
    }
}


// initialize grid
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

function initializeGridValues(height, width) {
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

    const values = {
        pressure: p,
        velocityX: vx,
        velocityY: vy
    };

    return values;
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
    console.log("done", geometry.size);
    return geometry;
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

function horizontalCoords(canvas) {
    const rect = canvas.getBoundingClientRect();

    let hCoords = [];
    const hIndent = (rect.right - rect.left) / gridWidth;
    for (let i = 0; i < gridWidth + 1; i++) {
        hCoords.push(toClipCoords(rect.left + hIndent * i, canvas, "x"));
    }
    return hCoords;
}