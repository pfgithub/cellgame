function apply_rules(surrounding_25) {
    surrounding_25;
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