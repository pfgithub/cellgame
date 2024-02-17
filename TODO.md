- [ ] coal, falls into sand-like piles. think this requires we support ul, ur, bl, br.
- [ ] wire, transfers electro-bolts
- [ ] generator, turns coal into electro-bolts
- [ ] pipe, transfers water packets
- [ ] pump, pumps water into pipes using electro-bolts

consider:
- [ ] fake pressure - this doesn't count towards total energy but it would influence
  what direction the water wants to go
- [ ] or real pressure. water has 200 pressure up to max 255
  - add more electricity by making higher pressure electrobolt packets.
  - i think we should do real pressure, that way we remove randomness from the
    water beyond maybe which direction to spread when it can
  - water would leave 1-pressure tiles over all the surfaces it spills on
  - only trouble is fluid mixing is weird like oni
- [ ] real heat
  - allows machines to output heat. tiles do heat exchange with their surroundings
    based on the tile. each heat counts for say 1 energy, max 65536 heat
  - if an electrobolt hits the end of a line and dies, it could dissapate into heat
  - some tiles could state change on hot / cold, ie water to steam / ice
- [ ] better not gate that supports signals from either side