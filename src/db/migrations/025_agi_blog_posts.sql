-- Two blog posts about the AGI Infra projects listed on the site, illustrated with the project images already in public/properties.
INSERT INTO blog_posts (slug, title, category, author, cover, excerpt, body, meta_title, meta_description, status, published_at)
SELECT 'jalandhar-heights-ii-iii-iv-compared',
  'Jalandhar Heights II, III and IV compared: which AGI apartment suits your family?',
  'Projects', 'Manav Narula', '/properties/jalandhar-heights-iv/aerial.png',
  'Three phases of AGI Infra''s Jalandhar Heights township, from 1,330 sq. ft. 2 BHKs to 4,200 sq. ft. duplexes. Here is how they differ in size, layout and lifestyle, and how to pick the right one.',
  $body$Jalandhar Heights is AGI Infra Limited's largest township in the city, and it is now three separate projects at very different sizes. Buyers often ask us which phase is "better". The honest answer is that they are built for different families, so the right question is which one fits yours.

This guide compares the three phases we list: Jalandhar Heights II, III and IV. All sizes below are from the developer's own floor plans.

## The short version

- **Jalandhar Heights II:** the widest choice and the most compact homes, from a 1,330 sq. ft. 2 BHK to 2,400 sq. ft. 4 BHKs, plus 4+1 BHK residences at the Iconic Tower and penthouses.
- **Jalandhar Heights III:** mid-to-large homes, a 1,720 sq. ft. 3 BHK, a 2,800 sq. ft. 4 BHK and 4,200 sq. ft. duplexes, built with Mivan technology.
- **Jalandhar Heights IV:** the largest and most premium, from a 1,800 sq. ft. 3 BHK up to a 3,600 sq. ft. 5+1 BHK, with 83% open area.

![Jalandhar Heights IV towers seen from the main road](/properties/jalandhar-heights-iv/towers.webp)

## Jalandhar Heights II: the most choice

Jalandhar Heights II suits first-time buyers and families moving up from a 2 BHK, because it covers the widest range of sizes in one community.

- 2 BHK, 1,330 sq. ft., Blocks D, E and F
- 3 BHK, 1,600 sq. ft., Blocks A, B, C, L, M and N
- 4 BHK, 2,400 sq. ft., Blocks G, H, I, J and K
- 4 BHK, 2,150 sq. ft., Blocks O, P and Q
- 4+1 BHK residences at the Iconic Tower, and penthouses outside Blocks A to F

The project is planned with 76% open area. Everyday conveniences are inside the complex: banks, laundry and convenience stores, a clubhouse with a restaurant, banquet hall, gym and swimming pool, squash, basketball and badminton courts, and on-campus healthcare with a doctor. A five-screen multiplex and a shopping mall are within walking distance.

![Pool-side view at Jalandhar Heights II](/properties/jalandhar-heights-ii/pool.jpeg)

## Jalandhar Heights III: larger homes and duplexes

Jalandhar Heights III, in the Pholriwal area, is for buyers who want more space without going to the very top of the range.

- 3 BHK, 1,720 sq. ft. (carpet 1,435 sq. ft.), Blocks A, B, C and D
- 4 BHK, 2,800 sq. ft. (carpet 2,410 sq. ft.), Blocks F and H
- Duplex, 4,200 sq. ft. (carpet 3,378 sq. ft.), Blocks D-I to D-IV

It is built with Mivan (aluminium formwork) construction, which gives strong, precise walls and fewer finishing defects. Homes come with modular kitchens with quartz tops, UPVC windows with tempered glass and steel mesh, and glass shower cabins. The open and green area is 84%. The duplexes are the real draw here: two floors, a family lounge and bar on the upper level, and wide balconies, which is rare in an apartment complex.

![Family lounge in a Jalandhar Heights III duplex](/properties/jalandhar-heights-iii/family-lounge.webp)

## Jalandhar Heights IV: the premium end

Jalandhar Heights IV is the newest phase and the most spacious, aimed at families who would otherwise buy a kothi.

- 3 BHK, 1,800 sq. ft. (carpet 1,485 sq. ft.), Blocks I, J, K and L
- 4 BHK, 2,500 sq. ft. (carpet 1,972 sq. ft.), Blocks D, E and F
- 4+1 BHK, 2,800 sq. ft. (carpet 2,258 sq. ft.), Blocks C, G and H
- 5+1 BHK, 3,600 sq. ft. (carpet 2,927 sq. ft.), Blocks A and B

What sets it apart is the specification: 3.6 m floor-to-floor height, Botticino marble in the living and dining areas, wooden flooring in bedrooms, Jaquar or Grohe fittings, and a structure designed for Seismic Zone V. The project keeps 83% of the land open and green, has a no-vehicle zone at ground level with two levels of basement parking, five-tier security with panic buttons in every flat, and a rooftop swimming pool. Its list of more than 30 amenities includes a spa, banquet halls, a mini golf putting area and cricket nets.

![Central garden at Jalandhar Heights IV](/properties/jalandhar-heights-iv/garden.webp)

## How to choose

1. **Start with the carpet area, not the built-up figure.** Carpet area is the usable floor inside your walls. Compare carpet to carpet across phases.
2. **Decide on the block, not just the size.** In each phase, sizes are tied to specific blocks. Ask which side of the block faces the garden and which faces the road.
3. **Weigh the specification against the budget.** Jalandhar Heights IV costs more per sq. ft. partly because of the marble, ceiling height and security. If those matter less to you, II or III gives more space for the money.
4. **Visit at two times of day.** Morning light and evening traffic change how a flat feels. We arrange visits to all three phases in a single trip.

## Visit with us

We take buyers through all three phases in one accompanied visit and share current availability, prices and payment plans in writing. [Send us your requirement](/contact) or open the listings for [Jalandhar Heights II](/properties/jalandhar-heights-ii), [III](/properties/jalandhar-heights-iii) and [IV](/properties/jalandhar-heights-iv) to see the floor plans and master plans.$body$,
  'Jalandhar Heights II vs III vs IV: AGI apartments compared',
  'Sizes, blocks, specifications and lifestyle of AGI Infra''s Jalandhar Heights II, III and IV, and how to choose the right phase for your family.',
  'Published', '2026-10-05 09:00:00+05:30'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'jalandhar-heights-ii-iii-iv-compared');

INSERT INTO blog_posts (slug, title, category, author, cover, excerpt, body, meta_title, meta_description, status, published_at)
SELECT 'agi-prestige-sky-garden-sky-villas-guide',
  'Beyond Jalandhar Heights: AGI''s Prestige, Sky Garden and Sky Villas explained',
  'Projects', 'Manav Narula', '/properties/agi-sky-garden/towers.webp',
  'From value 2 BHKs on G.T. Road to 5 BHK sky residences in Ludhiana, here is what AGI Infra''s Prestige, Sky Garden and Sky Villas offer, who each one suits, and what to check before you book.',
  $body$Most buyers know AGI Infra Limited for the Jalandhar Heights township. The developer's other projects are just as interesting, and they cover the two ends of the market: well-priced 2 and 3 BHK homes on one side, and very large luxury apartments on the other. Here is how Prestige by AGI, AGI Sky Garden and AGI Sky Villas compare.

## Prestige by AGI: a practical 3 BHK

Prestige is at AGI Urbana and is designed for families who want a sensible 3 BHK with good light and privacy, without paying for features they will not use.

- 3 BHK, 1,300 sq. ft. built-up (carpet 960 sq. ft.), in Towers A to F
- Four homes per floor, so every flat gets cross-ventilation and fewer shared walls
- 713 homes in all, with 88% open and green area

It is built with aluminium formwork to Seismic Zone V standards, with two levels of basement parking, high-speed lifts, two-tier 24x7 security and fire safety to NBC norms. Inside, you get premium vitrified tiles in living areas, a choice of wooden or tile flooring in bedrooms, gypsum false ceilings and UPVC windows. Wardrobe space is provided, with woodwork left to the owner.

![Prestige by AGI towers at AGI Urbana](/properties/prestige-by-agi/towers.jpg)

## AGI Sky Garden: a complete community on G.T. Road

AGI Sky Garden on G.T. Road, Jalandhar, is really five projects in one: AGI Sky Garden I, II and III and AGI Maxima I and II. Together they form one of the largest residential communities in the city, with 68% open area overall.

- 2 BHK, 820 and 880 sq. ft.
- 3 BHK, 1,200 and 1,300 sq. ft.

The appeal is everything that comes with the community: a clubhouse with a residents' lounge and restaurant, a rooftop and an indoor swimming pool, a gymnasium, spa and steam rooms, basketball, lawn tennis and badminton courts, cricket nets, a jogging track, children's play areas, a pet-friendly zone, a dispensary with a doctor, and a shopping complex inside the premises. It suits young families and first-time buyers who want city connectivity on G.T. Road and amenities on their doorstep.

![The shopping street inside AGI Sky Garden](/properties/agi-sky-garden/shopping-street.webp)

## AGI Sky Villas, Ludhiana: very large homes

AGI Sky Villas is on Pakhowal Road, Ludhiana, with direct access to 200 Feet Road and two-way access from Phullanwal Chowk. These are among the largest apartments in the region.

- 4 BHK, 2,600 sq. ft. (Towers B, C and D)
- 4 BHK, 3,500 and 4,000 sq. ft. (Towers E to J)
- 5 BHK, 5,200 sq. ft. (Tower A), and penthouses

The specification matches the size: 3.6 m floor-to-floor height, Botticino marble in the living areas, wooden flooring in bedrooms, three high-speed lifts per tower, five-tier security with panic buttons in every flat, and a Seismic Zone V structure. 80% of the land is open and green, and there is no vehicle movement at ground level. For Jalandhar families with business in Ludhiana, or buyers moving up from a kothi, it is worth a visit.

![Living room in an AGI Sky Villas show flat](/properties/agi-sky-villas/interior-living-dining.webp)

## Which one is for you?

- **First home or a young family:** AGI Sky Garden, for the amenities and the 2 BHK options.
- **A sensible, well-ventilated 3 BHK:** Prestige by AGI.
- **The most space and the highest specification:** AGI Sky Villas in Ludhiana, or Jalandhar Heights IV if you want to stay in Jalandhar.

## Five things to check before you book

1. **Carpet area in writing.** Built-up and super area include walls and common spaces. Your agreement should state the carpet area of your flat.
2. **The project's RERA registration.** Look the project up on the Punjab RERA website and make sure the tower you are booking is covered by that registration.
3. **Possession date and penalty clause.** The builder buyer agreement should give a possession date and what you receive if it slips.
4. **Payment plan.** Know which payments are linked to construction stages and which are fixed dates.
5. **Maintenance and other charges.** Ask for the monthly maintenance estimate, parking, club membership and power backup charges up front.

## Talk to us

We arrange visits to all these projects, compare current offers side by side and help with home loans from our partner banks. [Send us your requirement](/contact), or see the full details, floor plans and master plans of [Prestige by AGI](/properties/prestige-by-agi), [AGI Sky Garden](/properties/agi-sky-garden) and [AGI Sky Villas](/properties/agi-sky-villas).$body$,
  'AGI Prestige, Sky Garden and Sky Villas: a buyer''s guide',
  'What AGI Infra''s Prestige by AGI, AGI Sky Garden (G.T. Road, Jalandhar) and AGI Sky Villas (Ludhiana) offer, who each suits, and five checks before booking.',
  'Published', '2026-10-05 10:00:00+05:30'
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = 'agi-prestige-sky-garden-sky-villas-guide');
