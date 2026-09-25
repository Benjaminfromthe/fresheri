// ─────────────────────────────────────────────────────────────
// Rwanda Geographical Constants
// All 5 Provinces and their 30 Districts
// Source: Rwanda Local Government (MINALOC) official structure
// ─────────────────────────────────────────────────────────────

export interface RwandaDistrict {
  id:         string;
  name:       string;
  provinceId: string;
}

export interface RwandaProvince {
  id:        string;
  name:      string;
  districts: RwandaDistrict[];
}

export const RWANDA_PROVINCES: RwandaProvince[] = [
  {
    id:   "kigali",
    name: "Kigali City",
    districts: [
      { id: "gasabo",     name: "Gasabo",     provinceId: "kigali" },
      { id: "kicukiro",   name: "Kicukiro",   provinceId: "kigali" },
      { id: "nyarugenge", name: "Nyarugenge", provinceId: "kigali" },
    ],
  },
  {
    id:   "north",
    name: "Northern Province",
    districts: [
      { id: "burera",   name: "Burera",   provinceId: "north" },
      { id: "gakenke",  name: "Gakenke",  provinceId: "north" },
      { id: "gicumbi",  name: "Gicumbi",  provinceId: "north" },
      { id: "musanze",  name: "Musanze",  provinceId: "north" },
      { id: "rulindo",  name: "Rulindo",  provinceId: "north" },
    ],
  },
  {
    id:   "south",
    name: "Southern Province",
    districts: [
      { id: "gisagara",  name: "Gisagara",  provinceId: "south" },
      { id: "huye",      name: "Huye",      provinceId: "south" },
      { id: "kamonyi",   name: "Kamonyi",   provinceId: "south" },
      { id: "muhanga",   name: "Muhanga",   provinceId: "south" },
      { id: "nyamagabe", name: "Nyamagabe", provinceId: "south" },
      { id: "nyanza",    name: "Nyanza",    provinceId: "south" },
      { id: "nyaruguru", name: "Nyaruguru", provinceId: "south" },
      { id: "ruhango",   name: "Ruhango",   provinceId: "south" },
    ],
  },
  {
    id:   "east",
    name: "Eastern Province",
    districts: [
      { id: "bugesera",  name: "Bugesera",  provinceId: "east" },
      { id: "gatsibo",   name: "Gatsibo",   provinceId: "east" },
      { id: "kayonza",   name: "Kayonza",   provinceId: "east" },
      { id: "kirehe",    name: "Kirehe",    provinceId: "east" },
      { id: "ngoma",     name: "Ngoma",     provinceId: "east" },
      { id: "nyagatare", name: "Nyagatare", provinceId: "east" },
      { id: "rwamagana", name: "Rwamagana", provinceId: "east" },
    ],
  },
  {
    id:   "west",
    name: "Western Province",
    districts: [
      { id: "karongi",    name: "Karongi",    provinceId: "west" },
      { id: "rutsiro",    name: "Rutsiro",    provinceId: "west" },
      { id: "rubavu",     name: "Rubavu",     provinceId: "west" },
      { id: "nyabihu",    name: "Nyabihu",    provinceId: "west" },
      { id: "nyamasheke", name: "Nyamasheke", provinceId: "west" },
      { id: "rusizi",     name: "Rusizi",     provinceId: "west" },
      { id: "ngororero",  name: "Ngororero",  provinceId: "west" },
    ],
  },
];

/** Flat list of all districts for quick lookup */
export const ALL_DISTRICTS: RwandaDistrict[] = RWANDA_PROVINCES.flatMap(
  (p) => p.districts
);

/** Get districts for a given province ID */
export function getDistrictsByProvince(provinceId: string): RwandaDistrict[] {
  return RWANDA_PROVINCES.find((p) => p.id === provinceId)?.districts ?? [];
}

/** Get province that contains a given district ID */
export function getProvinceByDistrict(districtId: string): RwandaProvince | null {
  return (
    RWANDA_PROVINCES.find((p) =>
      p.districts.some((d) => d.id === districtId)
    ) ?? null
  );
}

/** Format a district name for display (e.g. "Musanze" → "Musanze District") */
export function formatDistrictLabel(name: string): string {
  return `${name} District`;
}
