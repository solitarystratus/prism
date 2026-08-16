export function makePrimary(type, tier = 0) {
  if (type === 'beacons') return { type, target:5 + (tier % 2), label:'Awaken Rainbow Beacons', short:'AWAKEN BEACONS', hudLabel:'BEACONS' };
  if (type === 'cloudLandings') return { type, target:6 + (tier % 2), label:'Cloud Tour', short:'LAND ON CLOUDS', hudLabel:'CLOUDS' };
  if (type === 'springBounces') return { type, target:2, label:'Spring Trail', short:'RIDE SPRING CLOUDS', hudLabel:'SPRINGS' };
  return { type:'prisms', target:10 + (tier % 3), label:'Gather Prisms', short:'GATHER PRISMS', hudLabel:'PRISMS' };
}

export function buildBonusObjectives(tier, primaryType) {
  const pool = [
    { type:'prisms', target:4, label:'Prism Pocket', short:'COLLECT 4 PRISMS' },
    { type:'cloudLandings', target:4 + (tier % 2), label:'Cloud Hopper', short:`LAND ON ${4 + (tier % 2)} CLOUDS` },
    { type:'springBounces', target:1, label:'Spring Rider', short:'1 SPRING BOUNCE' },
    { type:'bursts', target:1 + (tier % 2), label:'Rainbow Rush', short:`${1 + (tier % 2)} RAINBOW BURST${tier % 2 ? 'S' : ''}` }
  ].filter(o => o.type !== primaryType);

  const objectiveCount = tier >= 8 ? 3 : 2;
  return Array.from({ length: objectiveCount }, (_, i) => ({ ...pool[(tier + i) % pool.length] }));
}
