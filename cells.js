const WIDTH = 20;
const HEIGHT = 20;
const SCALE_FACTOR = 20;

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
const prev_save = localStorage.getItem("cells-savefile");
if(prev_save != null) {
    base64ToUint8a(prev_save, tiles);
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
    const tstart = performance.now();
    tick_count += 1;
    let frame_seed = cyrb53("", tick_count);
    for(let y = 0; y < HEIGHT; y++) {
        for(let x = 0; x < WIDTH; x++) {
            let chance = (x, y) => {
                const cstr = "" + (x) + "," + (y);
                const res = cyrb53(cstr, tick_count) % 100;
                return res;
            };

            const nvalue = apply_rules(chance, tvalue, x, y);
            tiles[tindex(x, y) + 1] = nvalue;
        }
    }
    const tend = performance.now();
    for(let y = 0; y < HEIGHT; y++) {
        for(let x = 0; x < WIDTH; x++) {
            const tv = tiles[tindex(x, y) + 1];
            tset(x, y, tv);
        }
    }
    speedval.textContent = "time: " + (tend - tstart);
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

let play_interval = null;

function mkdiv(children) {
    const res = document.createElement("div");
    for(const child of children) res.appendChild(child);
    return res;
}
function mkbtn(label, callback) {
    const res = document.createElement("button");
    res.onclick = callback;
    res.textContent = label;
    return res;
}
function mknod(val) {
    return document.createTextNode(val);
}

let line_size = 0;
let line_element = WATER;

const tval = document.createElement("div");
document.body.appendChild(tval);
const btn_container = document.createElement("div");
const tick_button = document.createElement("button");
tick_button.textContent = "tick";
tick_button.onclick = () => {
    tick();
    render();
}
btn_container.appendChild(tick_button);
const play_btn = document.createElement("button");
play_btn.textContent = "play";
play_btn.onclick = () => {
    if(play_interval != null) {
        play_btn.textContent = "play";
        clearInterval(play_interval);
        play_interval = null;
    }else{
        play_btn.textContent = "pause";
        play_interval = setInterval(() => {
            tick();
            render();
        }, 1000 / 60);
    }
};
btn_container.appendChild(play_btn);
document.body.appendChild(btn_container);
const speedval = document.createElement("div");
document.body.appendChild(speedval);
document.body.appendChild(mkdiv([
    mknod("line size"),
    mkbtn("1", () => line_size = 0),
    mkbtn("3", () => line_size = 1),
    mkbtn("5", () => line_size = 2),
    mkbtn("7", () => line_size = 3),
    mkbtn("9", () => line_size = 4),
]));
document.body.appendChild(mkdiv([
    mknod("element"),
    ...[AIR, WATER,
        DATA_WIRE_OFF,
        DATA_WIRE_SET_ON,
        DATA_WIRE_NAND_DOWN_OFF,
        WIRE, ELECTROBOLT,
    ].map(item => {
        return mkbtn(tile_spec[item].name, () => line_element = item);
    }),
]));

setInterval(() => {
    localStorage.setItem("cells-savefile", uint8aToBase64(tiles));
}, 1000);

function setcanvas(ev) {
    const canvas_pos = canvas.getBoundingClientRect();
    const offset_x = ev.clientX - canvas_pos.x;
    const offset_y = ev.clientY - canvas_pos.y;
    const [x, y] = [
        Math.floor(offset_x / SCALE_FACTOR),
        Math.floor(offset_y / SCALE_FACTOR),
    ];
    for(let xo = -line_size; xo <= line_size; xo++) {
        for(let yo = -line_size; yo <= line_size; yo++) {
            tset(x + xo, y + yo, line_element);
        }
    }
    render();
}

canvas.onmousedown = ev => {
    const mmeh = ev => {
        setcanvas(ev);
    };
    document.addEventListener("mousemove", mmeh, {capture: true});
    document.addEventListener("mouseup", ev => {
        document.removeEventListener("mousemove", mmeh, {capture: true});
    }, {capture: true, once: true});
    setcanvas(ev);
};

render();
function base64ToUint8a(base64, result) {
    const bstr = atob(base64);
    for (let i = 0; i < bstr.length; i++) {
        result[i] = bstr.charCodeAt(i);
    }
    console.log(result, bstr);
}
function uint8aToBase64(u8a){
    const res = [];
    for(let i = 0; i < u8a.length; i++) {
        res.push(String.fromCharCode(u8a[i]));
    }
    return btoa(res.join(""));
  }