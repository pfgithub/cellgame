const WIDTH = 10;
const HEIGHT = 10;
const SCALE_FACTOR = 40;

const canvas = document.createElement("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.imageRendering = "pixelated";
canvas.style.width = (WIDTH * SCALE_FACTOR)+"px";
canvas.style.height = (HEIGHT * SCALE_FACTOR)+"px";
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d", {alpha: false});

const tiles = new Uint8ClampedArray(4 * WIDTH * HEIGHT);
const tiles_imagedata = new ImageData(tiles, WIDTH, HEIGHT);

function tindex(x, y) {
    return (y * WIDTH + x) * 4;
}
function tvalue(x, y) {
    if(x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return OUT_OF_BOUNDS;
    return tiles[tindex(x, y)];
}
function tset(x, y, value) {
    if(x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
    const i = tindex(x, y);
    const [g, b] = tile_spec[value].color;
    tiles[i + 0] = value;
    tiles[i + 1] = g;
    tiles[i + 2] = b;
    tiles[i + 3] = 255;
}

// tile init
for(let y = 0; y < HEIGHT; y++) {
    for(let x = 0; x < WIDTH; x++) {
        tset(x, y, AIR);
    }
}

const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

let tick_count = 0;
function tick() {
    tick_count += 1;
    let frame_seed = cyrb53("", tick_count);
    for(let y = 0; y < HEIGHT; y++) {
        for(let x = 0; x < WIDTH; x++) {
            // let chance = (xo, yo) => {
            //     return cyrb53("" + (x + xo) + "," + (y + yo), tick_count) % 100;
            // };
            let chance = () => frame_seed % 100;
            const ul = tvalue(x - 1, y - 1);
            const left = tvalue(x - 1, y);
            const bl = tvalue(x - 1, y + 1);
            const up = tvalue(x, y - 1);
            const tile = tvalue(x, y);
            const down = tvalue(x, y + 1);
            const ur = tvalue(x + 1, y - 1);
            const right = tvalue(x + 1, y);
            const br = tvalue(x + 1, y + 1);

            const nvalue = apply_rules(chance, ul, left, bl, up, tile, down, ur, right, br);
            tiles[tindex(x, y) + 1] = nvalue;
        }
    }
    for(let y = 0; y < HEIGHT; y++) {
        for(let x = 0; x < WIDTH; x++) {
            const tv = tiles[tindex(x, y) + 1];
            tset(x, y, tv);
        }
    }
}
function measure() {
    let total = 0;
    for(let y = 0; y < HEIGHT; y++) {
        for(let x = 0; x < WIDTH; x++) {
            const tile = tvalue(x, y);
            const tinfo = tile_spec[tile];
            total += tinfo.energy;
        }
    }
    return total;
}
function render() {
    ctx.putImageData(tiles_imagedata, 0, 0);
    tval.textContent = "total: " + measure();
}

const btn_container = document.createElement("div");
const tick_button = document.createElement("button");
tick_button.textContent = "tick";
tick_button.onclick = () => {
    tick();
    render();
}
btn_container.appendChild(tick_button);
const tval = document.createElement("div");
document.body.appendChild(tval);
document.body.appendChild(btn_container);

function setcanvas(ev) {
    const [x, y] = [ev.offsetX / SCALE_FACTOR |0, ev.offsetY / SCALE_FACTOR |0];
    tset(x, y, WATER);
    render();
}

let mouse_down = false;
canvas.onmousedown = ev => {
    mouse_down = true;
    setcanvas(ev);
};
canvas.onmouseup = ev => {
    mouse_down = false;
    setcanvas(ev);
};
canvas.onmousemove = ev => {
    if(mouse_down) setcanvas(ev);
};

render();