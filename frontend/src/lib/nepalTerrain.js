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
  // Koshi Province
  { district: 'SOLUKHUMBU', tokens: ['everest', 'solukhumbu', 'khumbu', 'namche', 'gokyo', 'tengboche'] },
  { district: 'ILAM', tokens: ['ilam'] },
  { district: 'SANKHUWASABHA', tokens: ['makalu', 'kanchenjunga'] },
  { district: 'SAPTARI', tokens: ['koshi tappu'] },
  // Madhesh Province
  { district: 'DHANUSA', tokens: ['janakpur'] },
  // Bagmati Province
  { district: 'KATHMANDU', tokens: ['kathmandu', 'pashupatinath', 'boudhanath', 'swayambhunath', 'monkey'] },
  { district: 'BHAKTAPUR', tokens: ['bhaktapur', 'nagarkot'] },
  { district: 'LALITPUR', tokens: ['patan', 'lalitpur'] },
  { district: 'KAVREPALANCHOWK', tokens: ['dhulikhel', 'namobuddha'] },
  { district: 'CHITWAN', tokens: ['chitwan', 'sauraha'] },
  { district: 'RASUWA', tokens: ['langtang', 'gosaikunda', 'helambu'] },
  { district: 'NUWAKOT', tokens: ['trisuli'] },
  // Gandaki Province
  { district: 'KASKI', tokens: ['pokhara', 'kaski', 'paragliding'] },
  { district: 'MANANG', tokens: ['manang', 'tilicho', 'annapurna'] },
  { district: 'MUSTANG', tokens: ['mustang', 'muktinath', 'jomsom', 'upper mustang'] },
  { district: 'MYAGDI', tokens: ['poon hill', 'ghorepani'] },
  { district: 'GORKHA', tokens: ['gorkha', 'manaslu'] },
  { district: 'TANAHU', tokens: ['bandipur'] },
  // Lumbini Province
  { district: 'RUPANDEHI', tokens: ['lumbini', 'rupandehi', 'bhairahawa'] },
  { district: 'BARDIYA', tokens: ['bardia', 'bardiya'] },
  { district: 'PALPA', tokens: ['tansen', 'palpa'] },
  { district: 'KAPILVASTU', tokens: ['tilaurakot', 'kapilvastu'] },
  // Karnali Province
  { district: 'MUGU', tokens: ['rara'] },
  { district: 'DOLPA', tokens: ['dolpo', 'dolpa', 'phoksundo', 'shey'] },
  { district: 'JUMLA', tokens: ['jumla'] },
  // Sudurpashchim Province
  { district: 'KAILALI', tokens: ['shuklaphanta'] },
  { district: 'BAJHANG', tokens: ['khaptad'] },
  { district: 'DARCHULA', tokens: ['api'] },
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

const DISTRICT_TO_PROVINCE = {
  // Koshi
  TAPLEJUNG: 'Koshi', PANCHTHAR: 'Koshi', ILAM: 'Koshi', JHAPA: 'Koshi',
  MORANG: 'Koshi', SUNSARI: 'Koshi', DHANKUTA: 'Koshi', TEHRATHUM: 'Koshi',
  BHOJPUR: 'Koshi', SOLUKHUMBU: 'Koshi', OKHALDHUNGA: 'Koshi', KHOTANG: 'Koshi',
  UDAYAPUR: 'Koshi', SANKHUWASABHA: 'Koshi',
  // Madhesh
  SAPTARI: 'Madhesh', SIRAHA: 'Madhesh', DHANUSA: 'Madhesh', MAHOTTARI: 'Madhesh',
  SARLAHI: 'Madhesh', RAUTAHAT: 'Madhesh', BARA: 'Madhesh', PARSA: 'Madhesh',
  // Bagmati
  SINDHULI: 'Bagmati', RAMECHHAP: 'Bagmati', DOLAKHA: 'Bagmati',
  KAVREPALANCHOWK: 'Bagmati', SINDHUPALCHOK: 'Bagmati', RASUWA: 'Bagmati',
  NUWAKOT: 'Bagmati', DHADING: 'Bagmati', BHAKTAPUR: 'Bagmati',
  LALITPUR: 'Bagmati', KATHMANDU: 'Bagmati', MAKWANPUR: 'Bagmati', CHITWAN: 'Bagmati',
  // Gandaki
  GORKHA: 'Gandaki', MANANG: 'Gandaki', MUSTANG: 'Gandaki', MYAGDI: 'Gandaki',
  BAGLUNG: 'Gandaki', LAMJUNG: 'Gandaki', TANAHU: 'Gandaki', KASKI: 'Gandaki',
  SYANGJA: 'Gandaki', PARBAT: 'Gandaki', NAWALPUR: 'Gandaki',
  ARGHAKHANCHI: 'Gandaki', GULMI: 'Gandaki', PALPA: 'Gandaki',
  // Lumbini
  KAPILVASTU: 'Lumbini', RUPANDEHI: 'Lumbini', PARASI: 'Lumbini',
  DANG: 'Lumbini', PYUTHAN: 'Lumbini', ROLPA: 'Lumbini',
  'EASTERN RUKUM': 'Lumbini', BANKE: 'Lumbini', BARDIYA: 'Lumbini',
  // Karnali
  DOLPA: 'Karnali', MUGU: 'Karnali', HUMLA: 'Karnali', JUMLA: 'Karnali',
  KALIKOT: 'Karnali', DAILEKH: 'Karnali', JAJARKOT: 'Karnali',
  'WESTERN RUKUM': 'Karnali', SALYAN: 'Karnali', SURKHET: 'Karnali',
  // Sudurpashchim
  BAJURA: 'Sudurpashchim', BAJHANG: 'Sudurpashchim', DARCHULA: 'Sudurpashchim',
  ACHHAM: 'Sudurpashchim', DOTI: 'Sudurpashchim', DADELDHURA: 'Sudurpashchim',
  BAITADI: 'Sudurpashchim', KAILALI: 'Sudurpashchim', KANCHANPUR: 'Sudurpashchim',
};

export function getProvinceForDistrict(districtName) {
  return DISTRICT_TO_PROVINCE[normalizeDistrictName(districtName)] || null;
}
