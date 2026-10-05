const groups=[
 ['Hero examples',[
  ['hero-roster','Hero roster','Show your heroes, their levels and stars. Open an individual hero for upgrade details.'],
  ['hero-level-exp','Hero level and EXP','Show the hero name, level and EXP bar. Hero EXP can be used during Heroes Full Preparedness.'],
  ['hero-skill-books','Skill books','Show the skill name, level and required books. These are different from Hero EXP; check the Alliance Duel tasks before spending.'],
  ['hero-star-shards','Hero stars and shards','Show the current stars and required shards. Shards are different from Hero EXP; check the Alliance Duel tasks before spending.']
 ]],
 ['Research examples',[
  ['research-trees','Research tree','Show which tree contains your technology, then capture its upgrade details.'],
  ['research-upgrade-costs','Research upgrade','Show the technology name, current and next levels, costs and duration.'],
  ['research-speed-bonus','Research speed bonus','Tap the duration information to show your total research speed bonus. The adjusted duration already includes this bonus.'],
  ['research-queue','Research already running','Show the active technology and remaining timer. Mark it as already running.']
 ]],
 ['Training examples',[
  ['troop-training-timer','Training already running','Show the troop type, tier, batch quantity and timer. This is a remaining timer. For a new batch, enter its full training duration so the timeline can show when to start.']
 ]],
 ['Vehicle examples',[
  ['vehicle-upgrade','Vehicle upgrade','Show the vehicle name, level and required materials. Enter the details manually and confirm the live scoring tasks.'],
  ['vehicle-golden-wrench','Golden Wrench','Tap the item to show its name and purpose. This picture identifies the material; it is not a recommendation to purchase or spend it.'],
  ['vehicle-modification-blueprint','Modification Blueprint','Tap the item to show its name and purpose. Spend only when it is eligible for both Full Preparedness and Alliance Duel.']
 ]]
];
export function additionalExamples(){return groups.map(([title,examples])=>`<details class="screenshot-examples"><summary>${title}: what to screenshot</summary><div class="example-grid">${examples.map(([file,label,note])=>`<figure><a href="./examples/${file}.png" target="_blank" rel="noopener"><img src="./examples/${file}.png" alt="Last Z ${label}" width="${file==='vehicle-upgrade'?1154:303}" height="658" loading="lazy"></a><figcaption><strong>${label}</strong><p>${note}</p></figcaption></figure>`).join('')}</div><p class="muted">These are examples from our account. Your levels and quantities will be different. Check and enter hero, training and vehicle details manually.</p></details>`).join('');}
