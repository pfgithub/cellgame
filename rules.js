const OUT_OF_BOUNDS = 0;
const AIR = 140;
const WATER = 21;
const any = 1;

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
        energy: 100,
        color: [66, 191],
    },
};

function chance(tile) {
    return 50;
}
/*
problem:
- context window too small
- see:
- [ water ] air [ water ]
- water_left wants to move right. water_right wants to move left
- they don't realise that if they both do it, they'll merge.
and another problem:
*/
const no_move = 0;
const move_down = 1;
const move_right = 2;
const move_up = 3;
const move_left = 4;
function swap_target(gt, chance, x, y) {
    const tile = gt(x, y);
    const down = gt(x, y + 1);
    const right = gt(x + 1, y);
    const up = gt(x, y - 1);
    const left = gt(x - 1, y);
    if (tile === WATER) {
        if (down === AIR) return move_down;
        if (left === AIR && right !== AIR) return move_left;
        if (right === AIR && left !== AIR) return move_right;
        if (left === AIR && right === AIR) return gt(x, y) < 50 ? move_left : move_right;
    }
    return no_move;
}

const WATER__fall_down = Symbol("water_fall_down");
const WATER__move_left = Symbol("water_move_left");
const WATER__move_right = Symbol("water_move_right");
const no_change = Symbol("no change");
function stage1(chance, gt, x, y) {
    const left = gt(x - 1, y);
    const right = gt(x + 1, y);
    const up = gt(x, y - 1);
    const down = gt(x, y + 1);
    const tile = gt(x, y);

    if (tile === WATER && down === AIR) {
        return WATER__fall_down;
    } else if (tile === WATER && left === AIR && right === AIR) {
        const cv = chance(x, y);
        return cv < 33 ? WATER__move_left : cv < 66 ? WATER__move_right : no_change;
    } else if (tile === WATER && left === AIR) {
        return WATER__move_left;
    } else if (tile === WATER && right === AIR) {
        return WATER__move_right;
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

    if(up === WATER__fall_down) {
        return [
            ct,
            lt, WATER, rt,
            dt,
        ];
    }else if(left === WATER__move_right && right === WATER__move_left) {
        if(chance(x, y) < 50) {
            return [
                ut,
                ct, WATER, rt,
                dt,
            ];
        }else{
            return [
                ut,
                lt, WATER, ct,
                dt,
            ];
        }
    }else if(left === WATER__move_right) {
        return [
            ut,
            ct, WATER, rt,
            dt,
        ];
    }else if(right === WATER__move_left) {
        return [
            ut,
            lt, WATER, ct,
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
    const tdir = stage1(chance, gt, x, y);
    if(tdir === WATER__fall_down) {
        return getchange(chance, gt, x, y + 1)[0];
    }else if(tdir === WATER__move_right) {
        return getchange(chance, gt, x + 1, y)[1];
    }else if(tdir === WATER__move_left) {
        return getchange(chance, gt, x - 1, y)[3];
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