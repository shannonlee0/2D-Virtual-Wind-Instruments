const gridHeight = 220;
const gridWidth = 2*gridHeight;
const C = 343.2;
const RHO = 1.2;
const dt = 1 / 100000;

// implement CFL condition
const dx = 0.005;

// must be non-negative integer
const pmlThicknessBoundary = 10;
const pmlThicknessInstrument = 0;

// audio


class Grid {
    constructor() {
        // initialize empty grid
        const gridVertices = calculateGridVertices(verticalCoords(), horizontalCoords());
        const coordinates = initializeCoordinates(gridVertices);
        let color = initializeColor();
        console.log("IM HERE");
        // initialize pressure and velocity values
        let values = initializeGridValues();

        this.coordinates = coordinates;
        this.height = gridHeight;
        this.width = gridWidth;

        this.geometry = initializeGeometry();

        // set up damping values for outer boundary
        this.damping = initializeDamping();
        this.getDamping(pmlThicknessBoundary);

        this.p = values["pressure"];

        // initial conditions

        const coordI = 110;
        const coordJ = coordI * 2;
        const size = 15;

        for (let i = 0 + coordI; i < size + coordI; i++) {
            for (let j = 0 + coordJ; j < size + coordJ; j++) {
                this.p[i-50][j-200] = 1;
                this.p[i][j] = 1;
            }
        }

        this.vx = values["velocityX"];
        this.vy = values["velocityY"];

        this.color = color;

        this.play = false;

        this.frame = 0;
    }

    stepPressure() {
        for (let i = 1; i < gridHeight - 1; i++) {
            for (let j = 1; j < gridWidth - 1; j++) {
                let div_v = (this.vx[i + 1][j] - this.vx[i][j] + this.vy[i][j + 1] - this.vy[i][j]) / dx
                if (!this.geometry[i][j]) {
                    this.p[i][j] = ((-RHO * C * C * div_v * dt) + this.p[i][j]) / (1 + this.damping[i][j]);
                }
            }
        }
    }

    stepVelocity() {
        for (let i = 1; i < gridHeight - 1; i++) {
            for (let j = 1; j < gridWidth - 1; j++) {
                let grad_p_x = (this.p[i][j] - this.p[i-1][j]) / dx
                let grad_p_y = (this.p[i][j] - this.p[i][j-1]) / dx

                this.vx[i][j] = (-1 / RHO * dt * grad_p_x + this.vx[i][j]) / (1 + this.damping[i][j]);
                this.vy[i][j] = (-1 / RHO * dt * grad_p_y + this.vy[i][j]) / (1 + this.damping[i][j]);
            }
        }
    }

    colorCell(i, j, choice) {
        this.color[i][j] = choice;
    }

    mapPressure() {
        for (let i = 1; i < gridHeight - 1; i++) {
            for (let j = 1; j < gridWidth - 1; j++) {
                if (!this.geometry[i][j]) {
                    this.colorCell(i, j, pressureToColor(this.p[i][j]));
                }
            }
        }
    }

    drawInstrument(i, j) {
        const white = [1, 1, 1];
        // size must be even
        const size = 4;

        // change to circle
        for (let k = i - (size / 2); k < i + (size / 2); k++) {
            for (let n = j - (size / 2); n < j + (size / 2); n++) {
                this.geometry[k][n] = true;
                this.colorCell(k, n, white);
            }
        }
        console.log("drawn");

        if (moves.length == 0 || moves[moves.length - 1][0] != i || moves[moves.length - 1][1] != j) {
            moves.push([i, j]);
        }
    }

    drawAir(i, j) {
        const black = [0, 0, 0];
        this.colorCell(i, j, black);
        this.geometry[i][j] = false;
    }

    step() {
        this.stepVelocity();
        this.stepPressure();
        this.frame++;
    }

    getDamping(thickness) {
        for (let i = 0; i < gridHeight; i++) {
            for (let j = 0; j < gridWidth; j++) {
                // if is instrument
                if (this.geometry[i][j] == true) {
                    this.getSigmas(i, j, thickness);
                }
            }
        }
    }

    getSigmas(instrumentI, instrumentJ, thickness) {
        // given an instrument cell ij, check every cell located in range of thickness
        // directly edit damping field
        const step = 1 / (thickness + 1);
        for (let i = 0; i <= thickness*2 + 1; i++) {
            for (let j = 0; j <= thickness*2 + 1; j++) {
                const trueIndexI = instrumentI - thickness + i;
                const trueIndexJ = instrumentJ - thickness + j;
                // get label that indicates closeness to outer boundary [0, 1, ..., 1, 0]
                // add one, then multiply by step
                if ((trueIndexI >= 0 && trueIndexI < gridHeight) && (trueIndexJ >= 0 && trueIndexJ < gridWidth)) {
                    this.damping[trueIndexI][trueIndexJ] = Math.max(step * Math.min(getLabel(i, thickness) + 1, getLabel(j, thickness) + 1), this.damping[trueIndexI][trueIndexJ]);
                }
            }
        }
    }

    reset() {
        const newScene = new Grid(canvas);
        scene = newScene;
    }
}

function calculateGridVertices(vCoords, hCoords) {
    let triangle = [];
    let topTriangleVertices = [];
    for (let i = 0; i < gridHeight; i++) {
        for (let j = 0; j < gridWidth; j++) {
            triangle = [hCoords[j], vCoords[i], hCoords[j + 1], vCoords[i], hCoords[j], vCoords[i + 1]];
            topTriangleVertices.push(...triangle);
        }
    }

    let bottomTriangleVertices = [];
    for (let i = 0; i < gridHeight; i++) {
        for (let j = 0; j < gridWidth; j++) {
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

function initializeCoordinates(allVertices) {
    // returns coordinates 2d arr: cell-ij = [x1, y1, ..., x6, y6]
    let coordinates = [];
    for (let i = 0; i < gridHeight; i++) {
        coordinates[i] = [];
        for (let j = 0; j < gridWidth; j++) {
            // each cell's vertices described in chunks of 12
            coordinates[i][j] = allVertices.slice(12 * (gridWidth * i + j), 12 * (gridWidth * i + j) + 12);
        }
    }
    return coordinates;
}

function initializeColor() {
    let color = [];
    for (let i = 0; i < gridHeight; i++) {
        color[i] = [];
        for (let j = 0; j < gridWidth; j++) {
            // default color is black
            const black = [0, 0, 0];
            color[i][j] = black;
        }
    }
    return color;
}

function getVertices(coordinates, color) {
    // combine coordinate and color arrays: [x1, y2, R, G, B, ..., x6, y6, R, G, B]
    let vertices = [];
    for (let i = 0; i < gridHeight; i++) {
        for (let j = 0; j < gridWidth; j++) {
            for (let k = 0; k < 6; k++) {
                vertices.push(...coordinates[i][j].slice(k*2, k*2 + 2));
                vertices.push(...color[i][j]);
            }
        }
    }
    return vertices;
}

function initializeGridValues() {
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
            // make boundary "instrument" for damping purposes
            if (i == 0 || i == gridHeight - 1 || j == 0 || j == gridWidth - 1) {
                geometry[i][j] = true;
            }
            else {
                geometry[i][j] = false;
            }
        }
    }
    return geometry;
}

function initializeDamping() {
    let sigma = [];
    for (let i = 0; i < gridHeight; i++) {
        sigma[i] = [];
        for (let j = 0; j < gridWidth; j++) {
            sigma[i][j] = 0;
        }
    }
    return sigma;
}