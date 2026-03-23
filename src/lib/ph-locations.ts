/** Philippine provinces with their cities and municipalities for dropdown usage */

export interface PHLocation {
  province: string;
  city: string;
  region: string;
  type: 'city' | 'municipality';
}

export const PH_LOCATIONS: PHLocation[] = [
  // NCR - National Capital Region
  { region: 'NCR', province: 'Metro Manila', city: 'Manila', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Quezon City', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Caloocan', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Marikina', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Pasig', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Taguig', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Makati', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Pasay', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Mandaluyong', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'San Juan', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Navotas', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Malabon', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Valenzuela', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Las Piñas', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Muntinlupa', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Parañaque', type: 'city' },
  { region: 'NCR', province: 'Metro Manila', city: 'Pateros', type: 'municipality' },
  // Region III - Central Luzon
  { region: 'Region III', province: 'Bulacan', city: 'Malolos', type: 'city' },
  { region: 'Region III', province: 'Bulacan', city: 'Meycauayan', type: 'city' },
  { region: 'Region III', province: 'Bulacan', city: 'San Jose del Monte', type: 'city' },
  { region: 'Region III', province: 'Bulacan', city: 'Baliwag', type: 'municipality' },
  { region: 'Region III', province: 'Bulacan', city: 'Bocaue', type: 'municipality' },
  { region: 'Region III', province: 'Bulacan', city: 'Calumpit', type: 'municipality' },
  { region: 'Region III', province: 'Bulacan', city: 'Guiguinto', type: 'municipality' },
  { region: 'Region III', province: 'Bulacan', city: 'Marilao', type: 'municipality' },
  { region: 'Region III', province: 'Bulacan', city: 'Obando', type: 'municipality' },
  { region: 'Region III', province: 'Pampanga', city: 'Angeles', type: 'city' },
  { region: 'Region III', province: 'Pampanga', city: 'San Fernando', type: 'city' },
  { region: 'Region III', province: 'Pampanga', city: 'Mabalacat', type: 'city' },
  { region: 'Region III', province: 'Nueva Ecija', city: 'Cabanatuan', type: 'city' },
  { region: 'Region III', province: 'Nueva Ecija', city: 'Palayan', type: 'city' },
  { region: 'Region III', province: 'Nueva Ecija', city: 'San Jose', type: 'city' },
  { region: 'Region III', province: 'Nueva Ecija', city: 'Gapan', type: 'city' },
  { region: 'Region III', province: 'Bataan', city: 'Balanga', type: 'city' },
  { region: 'Region III', province: 'Bataan', city: 'Limay', type: 'municipality' },
  { region: 'Region III', province: 'Bataan', city: 'Mariveles', type: 'municipality' },
  { region: 'Region III', province: 'Zambales', city: 'Olongapo', type: 'city' },
  { region: 'Region III', province: 'Zambales', city: 'Subic', type: 'municipality' },
  { region: 'Region III', province: 'Tarlac', city: 'Tarlac City', type: 'city' },
  // Region IV-A - CALABARZON
  { region: 'Region IV-A', province: 'Cavite', city: 'Bacoor', type: 'city' },
  { region: 'Region IV-A', province: 'Cavite', city: 'Dasmariñas', type: 'city' },
  { region: 'Region IV-A', province: 'Cavite', city: 'Imus', type: 'city' },
  { region: 'Region IV-A', province: 'Cavite', city: 'Cavite City', type: 'city' },
  { region: 'Region IV-A', province: 'Cavite', city: 'General Trias', type: 'city' },
  { region: 'Region IV-A', province: 'Cavite', city: 'Tagaytay', type: 'city' },
  { region: 'Region IV-A', province: 'Cavite', city: 'Trece Martires', type: 'city' },
  { region: 'Region IV-A', province: 'Cavite', city: 'Silang', type: 'municipality' },
  { region: 'Region IV-A', province: 'Cavite', city: 'General Mariano Alvarez', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Calamba', type: 'city' },
  { region: 'Region IV-A', province: 'Laguna', city: 'San Pablo', type: 'city' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Santa Rosa', type: 'city' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Biñan', type: 'city' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Cabuyao', type: 'city' },
  { region: 'Region IV-A', province: 'Laguna', city: 'San Pedro', type: 'city' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Calauan', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Los Baños', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Bay', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Alaminos', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Magdalena', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Majayjay', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Nagcarlan', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Pagsanjan', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Liliw', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Lumban', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Siniloan', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Famy', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Mabitac', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Pangil', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Pakil', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Cavinti', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Pila', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Victoria', type: 'municipality' },
  { region: 'Region IV-A', province: 'Laguna', city: 'Santa Cruz', type: 'city' },
  { region: 'Region IV-A', province: 'Batangas', city: 'Batangas City', type: 'city' },
  { region: 'Region IV-A', province: 'Batangas', city: 'Lipa', type: 'city' },
  { region: 'Region IV-A', province: 'Batangas', city: 'Tanauan', type: 'city' },
  { region: 'Region IV-A', province: 'Batangas', city: 'Santo Tomas', type: 'city' },
  { region: 'Region IV-A', province: 'Batangas', city: 'Nasugbu', type: 'municipality' },
  { region: 'Region IV-A', province: 'Batangas', city: 'San Juan', type: 'municipality' },
  { region: 'Region IV-A', province: 'Rizal', city: 'Antipolo', type: 'city' },
  { region: 'Region IV-A', province: 'Rizal', city: 'Cainta', type: 'municipality' },
  { region: 'Region IV-A', province: 'Rizal', city: 'Taytay', type: 'municipality' },
  { region: 'Region IV-A', province: 'Rizal', city: 'Binangonan', type: 'municipality' },
  { region: 'Region IV-A', province: 'Rizal', city: 'Angono', type: 'municipality' },
  { region: 'Region IV-A', province: 'Rizal', city: 'Morong', type: 'municipality' },
  { region: 'Region IV-A', province: 'Rizal', city: 'Teresa', type: 'municipality' },
  { region: 'Region IV-A', province: 'Quezon', city: 'Lucena', type: 'city' },
  { region: 'Region IV-A', province: 'Quezon', city: 'Tayabas', type: 'city' },
  { region: 'Region IV-A', province: 'Quezon', city: 'Sariaya', type: 'municipality' },
  { region: 'Region IV-A', province: 'Quezon', city: 'Pagbilao', type: 'municipality' },
  // Region V - Bicol
  { region: 'Region V', province: 'Albay', city: 'Legazpi', type: 'city' },
  { region: 'Region V', province: 'Albay', city: 'Tabaco', type: 'city' },
  { region: 'Region V', province: 'Albay', city: 'Daraga', type: 'municipality' },
  { region: 'Region V', province: 'Camarines Sur', city: 'Naga', type: 'city' },
  { region: 'Region V', province: 'Camarines Sur', city: 'Iriga', type: 'city' },
  { region: 'Region V', province: 'Sorsogon', city: 'Sorsogon City', type: 'city' },
  // Region VI - Western Visayas
  { region: 'Region VI', province: 'Iloilo', city: 'Iloilo City', type: 'city' },
  { region: 'Region VI', province: 'Iloilo', city: 'Passi', type: 'city' },
  { region: 'Region VI', province: 'Negros Occidental', city: 'Bacolod', type: 'city' },
  { region: 'Region VI', province: 'Negros Occidental', city: 'Bago', type: 'city' },
  { region: 'Region VI', province: 'Negros Occidental', city: 'Silay', type: 'city' },
  { region: 'Region VI', province: 'Aklan', city: 'Kalibo', type: 'municipality' },
  { region: 'Region VI', province: 'Aklan', city: 'Malay (Boracay)', type: 'municipality' },
  { region: 'Region VI', province: 'Antique', city: 'San Jose de Buenavista', type: 'municipality' },
  { region: 'Region VI', province: 'Capiz', city: 'Roxas', type: 'city' },
  { region: 'Region VI', province: 'Guimaras', city: 'Jordan', type: 'municipality' },
  // Region VII - Central Visayas
  { region: 'Region VII', province: 'Cebu', city: 'Cebu City', type: 'city' },
  { region: 'Region VII', province: 'Cebu', city: 'Mandaue', type: 'city' },
  { region: 'Region VII', province: 'Cebu', city: 'Lapu-Lapu', type: 'city' },
  { region: 'Region VII', province: 'Cebu', city: 'Talisay', type: 'city' },
  { region: 'Region VII', province: 'Cebu', city: 'Danao', type: 'city' },
  { region: 'Region VII', province: 'Cebu', city: 'Toledo', type: 'city' },
  { region: 'Region VII', province: 'Cebu', city: 'Naga', type: 'city' },
  { region: 'Region VII', province: 'Bohol', city: 'Tagbilaran', type: 'city' },
  { region: 'Region VII', province: 'Negros Oriental', city: 'Dumaguete', type: 'city' },
  { region: 'Region VII', province: 'Siquijor', city: 'Siquijor', type: 'municipality' },
  // Region VIII - Eastern Visayas
  { region: 'Region VIII', province: 'Leyte', city: 'Tacloban', type: 'city' },
  { region: 'Region VIII', province: 'Leyte', city: 'Ormoc', type: 'city' },
  { region: 'Region VIII', province: 'Samar', city: 'Calbayog', type: 'city' },
  { region: 'Region VIII', province: 'Samar', city: 'Catbalogan', type: 'city' },
  // Region IX - Zamboanga Peninsula
  { region: 'Region IX', province: 'Zamboanga del Sur', city: 'Zamboanga City', type: 'city' },
  { region: 'Region IX', province: 'Zamboanga del Norte', city: 'Dipolog', type: 'city' },
  { region: 'Region IX', province: 'Zamboanga del Norte', city: 'Dapitan', type: 'city' },
  // Region X - Northern Mindanao
  { region: 'Region X', province: 'Misamis Oriental', city: 'Cagayan de Oro', type: 'city' },
  { region: 'Region X', province: 'Misamis Oriental', city: 'El Salvador', type: 'city' },
  { region: 'Region X', province: 'Misamis Occidental', city: 'Oroquieta', type: 'city' },
  { region: 'Region X', province: 'Misamis Occidental', city: 'Ozamiz', type: 'city' },
  { region: 'Region X', province: 'Bukidnon', city: 'Malaybalay', type: 'city' },
  { region: 'Region X', province: 'Lanao del Norte', city: 'Iligan', type: 'city' },
  // Region XI - Davao Region
  { region: 'Region XI', province: 'Davao del Sur', city: 'Davao City', type: 'city' },
  { region: 'Region XI', province: 'Davao del Norte', city: 'Tagum', type: 'city' },
  { region: 'Region XI', province: 'Davao del Norte', city: 'Panabo', type: 'city' },
  { region: 'Region XI', province: 'Davao Oriental', city: 'Mati', type: 'city' },
  // Region XII - SOCCSKSARGEN
  { region: 'Region XII', province: 'South Cotabato', city: 'General Santos', type: 'city' },
  { region: 'Region XII', province: 'South Cotabato', city: 'Koronadal', type: 'city' },
  { region: 'Region XII', province: 'Sarangani', city: 'Alabel', type: 'municipality' },
  { region: 'Region XII', province: 'North Cotabato', city: 'Kidapawan', type: 'city' },
  { region: 'Region XII', province: 'Sultan Kudarat', city: 'Isulan', type: 'municipality' },
  // Region XIII - Caraga
  { region: 'Region XIII', province: 'Agusan del Norte', city: 'Butuan', type: 'city' },
  { region: 'Region XIII', province: 'Agusan del Norte', city: 'Cabadbaran', type: 'city' },
  { region: 'Region XIII', province: 'Surigao del Norte', city: 'Surigao City', type: 'city' },
  // CAR - Cordillera Administrative Region
  { region: 'CAR', province: 'Benguet', city: 'Baguio', type: 'city' },
  { region: 'CAR', province: 'Benguet', city: 'La Trinidad', type: 'municipality' },
  { region: 'CAR', province: 'Ifugao', city: 'Lagawe', type: 'municipality' },
  { region: 'CAR', province: 'Mountain Province', city: 'Bontoc', type: 'municipality' },
  // BARMM
  { region: 'BARMM', province: 'Maguindanao del Norte', city: 'Cotabato City', type: 'city' },
  { region: 'BARMM', province: 'Lanao del Sur', city: 'Marawi', type: 'city' },
  // Region I - Ilocos Region
  { region: 'Region I', province: 'Ilocos Norte', city: 'Laoag', type: 'city' },
  { region: 'Region I', province: 'Ilocos Norte', city: 'Batac', type: 'city' },
  { region: 'Region I', province: 'Ilocos Sur', city: 'Vigan', type: 'city' },
  { region: 'Region I', province: 'La Union', city: 'San Fernando', type: 'city' },
  { region: 'Region I', province: 'Pangasinan', city: 'Dagupan', type: 'city' },
  { region: 'Region I', province: 'Pangasinan', city: 'San Carlos', type: 'city' },
  { region: 'Region I', province: 'Pangasinan', city: 'Urdaneta', type: 'city' },
  { region: 'Region I', province: 'Pangasinan', city: 'Alaminos', type: 'city' },
  // Region II - Cagayan Valley
  { region: 'Region II', province: 'Cagayan', city: 'Tuguegarao', type: 'city' },
  { region: 'Region II', province: 'Isabela', city: 'Cauayan', type: 'city' },
  { region: 'Region II', province: 'Isabela', city: 'Ilagan', type: 'city' },
  { region: 'Region II', province: 'Nueva Vizcaya', city: 'Bayombong', type: 'municipality' },
  // MIMAROPA
  { region: 'MIMAROPA', province: 'Palawan', city: 'Puerto Princesa', type: 'city' },
  { region: 'MIMAROPA', province: 'Palawan', city: 'El Nido', type: 'municipality' },
  { region: 'MIMAROPA', province: 'Palawan', city: 'Coron', type: 'municipality' },
  { region: 'MIMAROPA', province: 'Occidental Mindoro', city: 'Mamburao', type: 'municipality' },
  { region: 'MIMAROPA', province: 'Oriental Mindoro', city: 'Calapan', type: 'city' },
];

/** Get a flat sorted list of "City, Province" display strings */
export function getPHLocationOptions(): string[] {
  return PH_LOCATIONS
    .map((loc) => `${loc.city}, ${loc.province}`)
    .sort((a, b) => a.localeCompare(b));
}

/** Group locations by province for grouped dropdown */
export function getPHLocationsByProvince(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const loc of PH_LOCATIONS) {
    if (!grouped[loc.province]) grouped[loc.province] = [];
    grouped[loc.province].push(loc.city);
  }
  return grouped;
}

export const COMMON_NATIONALITIES = [
  'Filipino',
  'American',
  'Japanese',
  'Korean',
  'Chinese',
  'Australian',
  'British',
  'Canadian',
  'Singaporean',
  'Malaysian',
  'Indonesian',
  'Thai',
  'Vietnamese',
  'Indian',
  'German',
  'French',
  'Italian',
  'Spanish',
  'Dutch',
  'Russian',
  'Brazilian',
  'Mexican',
  'Other',
];
