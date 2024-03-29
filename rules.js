const OUT_OF_BOUNDS = 0;
const AIR = 140;
const WATER = 21;
const WIRE = 84; // wire wire electrobolt_back electrobolt_front wire
const ELECTROBOLT = 252; // energy of an electricity packet
const WIRE_JUST_BOLTED = 128; // same energy as a wire
const DATA_WIRE_OFF = 212;
const DATA_WIRE_ON = 12;
const DATA_WIRE_SET_ON = 5;
const DATA_WIRE_NAND_DOWN_OFF = 36;
const DATA_WIRE_NAND_DOWN_ON = 64;
const any = 1;

// nany gate SET_ON|ON|OFF

// signal bolts vs electro bolts
// - electro bolts store packets of energy
// - signal bolts store 

/*
automation wire:
- auto_wire_set_off
- auto_wire_set_on
*/

const tile_spec = {
    [OUT_OF_BOUNDS]: {
        name: "out_of_bounds",
        energy: 0,
        color: [0, 0],
    },
    [AIR]: {
        name: "air",
        energy: 10,
        color: [234, 255],
    },
    [WATER]: {
        name: "water",
        energy: 60,
        color: [66, 191],
    },
    [WIRE]: {
        name: "wire",
        energy: 90,
        color: [84, 84],
    },
    [WIRE_JUST_BOLTED]: {
        name: "wire_just_bolted",
        energy: 90,
        color: [111, 14],
    },
    [ELECTROBOLT]: {
        name: "electrobolt",
        energy: 200,
        color: [215, 3],
    },
    [DATA_WIRE_OFF]: {
        name: "data_wire_off",
        energy: 40,
        color: [47, 47],
    },
    [DATA_WIRE_ON]: {
        name: "data_wire_on",
        energy: 40,
        color: [171, 33],
    },
    [DATA_WIRE_SET_ON]: {
        name: "data_wire_set_on",
        energy: 40,
        color: [240, 36],
    },
    [DATA_WIRE_NAND_DOWN_OFF]: {
        name: "data_wire_nand_down_off",
        energy: 50,
        color: [36, 36],
    },
    [DATA_WIRE_NAND_DOWN_ON]: {
        name: "data_wire_nand_down_on",
        energy: 50,
        color: [54, 54],
    },
};

const WATER__fall_down = Symbol("water_fall_down");
const WATER__move_left = Symbol("water_move_left");
const WATER__move_right = Symbol("water_move_right");
const ELECTROBOLT__move_right = Symbol("electrobolt_move_right");
const ELECTROBOLT__move_up = Symbol("electrobolt_move_up");
const ELECTROBOLT__move_down = Symbol("electrobolt_move_down");
const ELECTROBOLT__move_left = Symbol("electrobolt_move_left");
const no_change = Symbol("no change");
function stage1(chance, gt, x, y) {
    const left = gt(x - 1, y);
    const right = gt(x + 1, y);
    const up = gt(x, y - 1);
    const down = gt(x, y + 1);
    const tile = gt(x, y);

    if (tile === WATER && down === AIR) {
        return WATER__fall_down;
    } else if (tile === WATER) {
        const cv = chance(x, y);
        return cv < 33 ? left === AIR ? WATER__move_left : no_change : cv < 66 ? right === AIR ? WATER__move_right : no_change : no_change;
    }
    if(tile === ELECTROBOLT) {
        if(up === WIRE_JUST_BOLTED && down === WIRE) return ELECTROBOLT__move_down;
        if(left === WIRE_JUST_BOLTED && right === WIRE) return ELECTROBOLT__move_right;
        if(right === WIRE_JUST_BOLTED && left === WIRE) return ELECTROBOLT__move_left;
        if(down === WIRE_JUST_BOLTED && up === WIRE) return ELECTROBOLT__move_up;
        const choices = [];
        if(down === WIRE) choices.push(ELECTROBOLT__move_down);
        if(right === WIRE) choices.push(ELECTROBOLT__move_right);
        if(left === WIRE) choices.push(ELECTROBOLT__move_left);
        if(up === WIRE) choices.push(ELECTROBOLT__move_up);
        if(choices.length === 0) return no_change;
        if(choices.length === 1) return choices[0];
        const cval = (chance(x, y) / 100 / choices.length) |0;
        return choices[cval];
        // instead of looping back after hitting a dead end, we should emit as heat
    }
    return no_change;
}

function getchange(chance, gt, x, y) {
    const center = stage1(chance, gt, x, y);
    const up = stage1(chance, gt, x, y - 1);
    const left = stage1(chance, gt, x - 1, y);
    const right = stage1(chance, gt, x + 1, y);
    const down = stage1(chance, gt, x, y + 1);

    const ut = gt(x, y - 1);
    const lt = gt(x - 1, y);
    const ct = gt(x, y);
    const rt = gt(x + 1, y);
    const dt = gt(x, y + 1);

    if(up === ELECTROBOLT__move_down) return [WIRE_JUST_BOLTED, lt, ut, rt, dt];
    if(down === ELECTROBOLT__move_up) return [ut, lt, dt, rt, WIRE_JUST_BOLTED];
    if(right === ELECTROBOLT__move_left) return [ut, lt, rt, WIRE_JUST_BOLTED, dt];
    if(left === ELECTROBOLT__move_right) return [ut, WIRE_JUST_BOLTED, lt, rt, dt];

    if(up === WATER__fall_down) {
        return [
            ct,
            lt, ut, rt,
            dt,
        ];
    }else if(left === WATER__move_right && right === WATER__move_left) {
        if(chance(x, y) < 50) {
            return [
                ut,
                ct, lt, rt,
                dt,
            ];
        }else{
            return [
                ut,
                lt, rt, ct,
                dt,
            ];
        }
    }else if(left === WATER__move_right) {
        return [
            ut,
            ct, lt, rt,
            dt,
        ];
    }else if(right === WATER__move_left) {
        return [
            ut,
            lt, rt, ct,
            dt,
        ];
    }else{
        return [
            ut,
            lt, ct, rt,
            dt,
        ];
    }
}

function apply_rules(chance, gt, x, y) {
    const ut = gt(x, y - 1);
    const lt = gt(x - 1, y);
    const ct = gt(x, y);
    const rt = gt(x + 1, y);
    const dt = gt(x, y + 1);

    if(ct === DATA_WIRE_OFF || ct === DATA_WIRE_ON) {
        const has_on = (
            lt === DATA_WIRE_SET_ON || rt === DATA_WIRE_SET_ON || ut === DATA_WIRE_SET_ON || dt === DATA_WIRE_SET_ON ||
            ut === DATA_WIRE_NAND_DOWN_ON
        );
        const has_off = (
            lt === DATA_WIRE_OFF || rt === DATA_WIRE_OFF || ut === DATA_WIRE_OFF || dt === DATA_WIRE_OFF ||
            ut === DATA_WIRE_NAND_DOWN_OFF
        );
        const soff = DATA_WIRE_OFF;
        const son = ct === DATA_WIRE_ON ? DATA_WIRE_ON : DATA_WIRE_SET_ON;
        if(has_on && has_off) {
            return DATA_WIRE_SET_ON;
        }else if(has_on) {
            return son;
        }else if(has_off) {
            return soff;
        }else{
            return ct;
        }
    }else if(ct === DATA_WIRE_SET_ON) {
        return DATA_WIRE_ON;
    }else if(ct === DATA_WIRE_NAND_DOWN_OFF || ct === DATA_WIRE_NAND_DOWN_ON) {
        const l_off = lt === DATA_WIRE_OFF;
        const u_off = ut === DATA_WIRE_OFF;
        const r_off = rt === DATA_WIRE_OFF;
        return l_off || u_off || r_off ? DATA_WIRE_NAND_DOWN_ON : DATA_WIRE_NAND_DOWN_OFF;
        return !(l_on && u_on && r_on);
    }

    if(ct === WIRE_JUST_BOLTED) {
        return WIRE;
    }

    const tdir = stage1(chance, gt, x, y);
    if(tdir === WATER__fall_down || tdir === ELECTROBOLT__move_down) {
        return getchange(chance, gt, x, y + 1)[0];
    }else if(tdir === WATER__move_right || tdir === ELECTROBOLT__move_right) {
        return getchange(chance, gt, x + 1, y)[1];
    }else if(tdir === WATER__move_left || tdir === ELECTROBOLT__move_left) {
        return getchange(chance, gt, x - 1, y)[3];
    }else if(tdir === ELECTROBOLT__move_up) {
        return getchange(chance, gt, x, y - 1)[4];
    }else{
        return getchange(chance, gt, x, y)[2];
    }
}

/*
each pixel looks at itself and its eight surrounding pixels to make a decison.
- if we want matter cannot be created or destroyed do we need to look at a 5x5 grid? instead of 3x3?
- to validate created/destroyed rules, give each tile a 'mass' count and make sure the total 'mass' count
  stays equal ignoring entries/exits from the system
  - this would mean that water in a pipe essentially costs one coal
    - and then when it is emitted from the pipe, where does that extra energy go?
    - kinetic energy doesn't exist in the world
    - we could store a heat value for every pixel and then the pump can only pump when
      its heat is < 254. and heat spreading causes heat to equalize around.
    - so the generator takes coal with energy 100 and creates a power bolt with energy 50
      and releases one heat, energy 50
    - the pump takes one power bolt, energy 50, and releases one heat, energy 50

- adding heat would start to move some stuff out of the simulation, we could move more
  stuff out too.

- testing rules to make sure they don't violate conservation should be doable
  - with 3x3 rules, make a 3x3 area with the borders out_of_bounds and test every combo
    - since the middle tile doesn't know the wall exists it should prove.
    - might not be possible to test every combo
      - depends how many tiles we have.
        with two tiles, it's (1 bit per tile) * (9 tiles) = 9 bits = 512 combos = doable

- ideally we run this whole thing on the gpu so we can do some big region like 2048x2048



generator:
- eats coal, outputs bolts

coal:
- piles in diagonal piles

conveyor_right, conveyor_left:
- moves coal right or left
  - maybe we don't need this, just make chutes.



tiles:
- wire, bolt_head, bolt_tail

rules:
- wire, surrounding_4_contains(bolt_head) => bolt_head
- bolt_head => bolt_tail
- bolt_tail => wire

^ if we want to not allow making free electricity we have to make sure packets can't split
   - do this by: when we spawn an electricity packet in an ambiguous place, set its direction
     randomly.
- we can make the electricity bounce back at the end of a wire:
  - 

electricity:
rules:
- electricity cannot be destroyed but not created and it can move.

tiles:
- wire, bolt_head, bolt_tail

rules:
- wire, surrounding4(bolt_head) => bolt_head

this isn't quite right


tiles:
- air, water

paired rules:
- air, above(water) => water
  - water, below(air) => air
- air, left(water, rand > 60%) and not downleft(air) => water
  - water(rand > 60%) and not down(air) => air
- air, right(water, rand < 30%) and not downright(air) => water
  - water(rand < 30%) and not down(air) => air

pumping water:
- water_pump, pipe, water_packet_front, water_packet_back, water_pump_with_water

- water_pump, below(water), surrounding4(bolt_head), no_surrounding4(wire), surrounding4(pipe == 1)
  => water_pump_with_water
- water_pump_with_water, above(pipe) => water_pump
- pipe, below(water_pump_with_water) => water_packet_front


randomness:
- each tile can have a random number associated with it, updated each tick (hash of tile pos & tick count)


we want:
- make it possible to move and transmutate things but not create things
- the game will spawn things
- cellular automata isn't good for that?

*/