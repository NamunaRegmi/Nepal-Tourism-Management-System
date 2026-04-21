export const TERRAIN_STYLES = {
  Himalayan: {
    label: 'Himalayan',
    color: '#2563eb',
    fill: '#dbeafe',
    description: 'High-altitude mountain terrain with alpine routes, dry valleys, and major trekking corridors.',
  },
  Hill: {
    label: 'Hill',
    color: '#16a34a',
    fill: '#dcfce7',
    description: 'Mid-hill valleys and ridges with heritage cities, viewpoints, forests, and mixed elevation travel.',
  },
  Terai: {
    label: 'Terai',
    color: '#ca8a04',
    fill: '#fef3c7',
    description: 'Lowland plains with wildlife reserves, pilgrimage sites, wetlands, and warmer subtropical travel.',
  },
};

export const DISTRICT_TERRAIN = {
  JHAPA: 'Terai',
  ILAM: 'Hill',
  PANCHTHAR: 'Hill',
  TAPLEJUNG: 'Himalayan',
  MORANG: 'Terai',
  SUNSARI: 'Terai',
  BHOJPUR: 'Hill',
  DHANKUTA: 'Hill',
  TEHRATHUM: 'Hill',
  SANKHUWASABHA: 'Himalayan',
  SAPTARI: 'Terai',
  SIRAHA: 'Terai',
  UDAYAPUR: 'Hill',
  KHOTANG: 'Hill',
  OKHALDHUNGA: 'Hill',
  SOLUKHUMBU: 'Himalayan',
  DHANUSA: 'Terai',
  MAHOTTARI: 'Terai',
  SARLAHI: 'Terai',
  SINDHULI: 'Hill',
  RAMECHHAP: 'Hill',
  DOLAKHA: 'Himalayan',
  BHAKTAPUR: 'Hill',
  DHADING: 'Hill',
  KATHMANDU: 'Hill',
  KAVREPALANCHOWK: 'Hill',
  LALITPUR: 'Hill',
  NUWAKOT: 'Hill',
  RASUWA: 'Himalayan',
  SINDHUPALCHOK: 'Himalayan',
  BARA: 'Terai',
  PARSA: 'Terai',
  RAUTAHAT: 'Terai',
  CHITWAN: 'Terai',
  MAKWANPUR: 'Hill',
  GORKHA: 'Hill',
  KASKI: 'Hill',
  LAMJUNG: 'Hill',
  SYANGJA: 'Hill',
  TANAHU: 'Hill',
  MANANG: 'Himalayan',
  KAPILVASTU: 'Terai',
  NAWALPUR: 'Terai',
  PARASI: 'Terai',
  RUPANDEHI: 'Terai',
  ARGHAKHANCHI: 'Hill',
  GULMI: 'Hill',
  PALPA: 'Hill',
  BAGLUNG: 'Hill',
  MYAGDI: 'Hill',
  PARBAT: 'Hill',
  MUSTANG: 'Himalayan',
  DANG: 'Terai',
  PYUTHAN: 'Hill',
  ROLPA: 'Hill',
  'EASTERN RUKUM': 'Himalayan',
  'WESTERN RUKUM': 'Hill',
  SALYAN: 'Hill',
  DOLPA: 'Himalayan',
  HUMLA: 'Himalayan',
  JUMLA: 'Himalayan',
  KALIKOT: 'Himalayan',
  MUGU: 'Himalayan',
  BANKE: 'Terai',
  BARDIYA: 'Terai',
  SURKHET: 'Hill',
  DAILEKH: 'Hill',
  JAJARKOT: 'Hill',
  KAILALI: 'Terai',
  ACHHAM: 'Hill',
  DOTI: 'Hill',
  BAJHANG: 'Himalayan',
  BAJURA: 'Himalayan',
  KANCHANPUR: 'Terai',
  DADELDHURA: 'Hill',
  BAITADI: 'Hill',
  DARCHULA: 'Himalayan',
};

const DISTRICT_MATCHERS = [
  { district: 'KATHMANDU', tokens: ['kathmandu'] },
  { district: 'KASKI', tokens: ['pokhara', 'kaski'] },
  { district: 'CHITWAN', tokens: ['chitwan', 'sauraha'] },
  { district: 'RUPANDEHI', tokens: ['lumbini', 'rupandehi', 'bhairahawa'] },
  { district: 'MANANG', tokens: ['manang'] },
  { district: 'MUSTANG', tokens: ['mustang', 'muktinath'] },
  { district: 'SOLUKHUMBU', tokens: ['everest', 'solukhumbu', 'khumbu', 'namche'] },
];

const DISTRICT_ALIASES = {
  DHANUSHA: 'DHANUSA',
  KAVREPALANCHOK: 'KAVREPALANCHOWK',
  KAVRE: 'KAVREPALANCHOWK',
  TANAHUN: 'TANAHU',
  NAWALPARASI: 'PARASI',
  'NAWALPARASI WEST': 'PARASI',
  'NAWALPARASI EAST': 'NAWALPUR',
  'RUKUM EAST': 'EASTERN RUKUM',
  'RUKUM WEST': 'WESTERN RUKUM',
};

export function normalizeDistrictName(name) {
  if (!name) {
    return null;
  }

  const upper = name.trim().toUpperCase();
  return DISTRICT_ALIASES[upper] || upper;
}

export function formatDistrictLabel(name) {
  const district = normalizeDistrictName(name);
  if (!district) {
    return '';
  }

  return district
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getTerrainForDistrict(districtName) {
  return DISTRICT_TERRAIN[normalizeDistrictName(districtName)] || 'Hill';
}

export function getDistrictForDestination(destination) {
  const lower = `${destination?.name || ''} ${destination?.description || ''}`.toLowerCase();
  const explicitMatch = DISTRICT_MATCHERS.find((entry) =>
    entry.tokens.some((token) => lower.includes(token))
  );

  if (explicitMatch) {
    return explicitMatch.district;
  }

  return Object.keys(DISTRICT_TERRAIN).find((district) =>
    lower.includes(formatDistrictLabel(district).toLowerCase())
  ) || null;
}

export function getDistrictPointForDestination(destination) {
  const district = getDistrictForDestination(destination);

  return district
    ? {
        district,
        terrain: getTerrainForDistrict(district),
      }
    : null;
}

export function getTerrainForDestination(destination) {
  return getTerrainForDistrict(getDistrictForDestination(destination));
}
