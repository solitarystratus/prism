export function regionAtmosphere(region, levelNumber) {
  const shimmer = ((levelNumber * 17) % 13) / 13;
  return {
    hue: region.hue + Math.round((shimmer - .5) * 6),
    rain: Math.max(.66, Math.min(.94, region.rain + (shimmer - .5) * .04))
  };
}
