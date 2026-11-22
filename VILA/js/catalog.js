// Shared auction catalog data - used by categories.html, live-auction.html, and server.js
const VELA_CATALOG = [
  {
    id: "dept-01",
    department: "Dept. 01",
    name: "SHOES & RARE FOOTWEAR",
    items: [
      {
        lotId: "104",
        brand: "BERLUTI",
        name: "Bespoke Patinated Calfskin Oxford (1895 Venezia Archive)",
        startingBid: 2500,
        estimate: "$4,000 – $6,000",
        img: "/assets/images/lot-104.jpg",
        specs: [
          { label: "Upper", value: "Patinated Calfskin" },
          { label: "Make", value: "Bespoke Bench-made" },
          { label: "Era", value: "1895 Archive" },
          { label: "Custody", value: "Paris Vault #01" },
        ],
      },
      {
        lotId: "105",
        brand: "LOUIS VUITTON × NIKE",
        name: "Air Force 1 by Virgil Abloh (Monogram Damier Edition)",
        startingBid: 12000,
        estimate: "$18,000 – $25,000",
        img: "/assets/images/lot-105.jpg",
        specs: [
          { label: "Material", value: "Monogram Damier" },
          { label: "Collaboration", value: "Virgil Abloh" },
          { label: "Condition", value: "Unworn Deadstock" },
          { label: "Custody", value: "Geneva Vault #02" },
        ],
      },
      {
        lotId: "106",
        brand: "JORDAN BRAND",
        name: '1985 Air Jordan 1 High OG "Chicago" Player Sample Prototype',
        startingBid: 25000,
        estimate: "$40,000 – $60,000",
        img: "/assets/images/lot-106.jpg",
        specs: [
          { label: "Colorway", value: "Chicago" },
          { label: "Year", value: "1985 Player Sample" },
          { label: "Condition", value: "Deadstock Prototype" },
          { label: "Custody", value: "New York Vault #07" },
        ],
      },
      {
        lotId: "107",
        brand: "MAISON MARGIELA",
        name: "Artisanal Split-Toe Tabi Boot (1998 Runway Archive)",
        startingBid: 3000,
        estimate: "$5,000 – $8,000",
        img: "/assets/images/lot-107.jpg",
        specs: [
          { label: "Last", value: "Split-Toe Tabi" },
          { label: "Material", value: "Artisanal Leather" },
          { label: "Season", value: "FW 1998 Runway" },
          { label: "Custody", value: "Paris Vault #03" },
        ],
      },
      {
        lotId: "108",
        brand: "RICK OWENS",
        name: 'Dunks "Geobasket" Dust/Black Crust Leather (2006 OG)',
        startingBid: 3500,
        estimate: "$5,500 – $8,500",
        img: "/assets/images/lot-108.png",
        specs: [
          { label: "Material", value: "Crust Leather" },
          { label: "Colorway", value: "Dust / Black" },
          { label: "Year", value: "2006 OG" },
          { label: "Custody", value: "Tokyo Vault #05" },
        ],
      },
      {
        lotId: "109",
        brand: "DIOR HOMME",
        name: '"Navigate" Combat Boot in Patent Leather by Hedi Slimane (FW07)',
        startingBid: 2000,
        estimate: "$3,500 – $5,000",
        img: "/assets/images/lot-109.webp",
        specs: [
          { label: "Material", value: "Patent Leather" },
          { label: "Designer", value: "Hedi Slimane" },
          { label: "Season", value: "FW07" },
          { label: "Custody", value: "Antwerp Vault #06" },
        ],
      },
    ],
  },
  {
    id: "dept-02",
    department: "Dept. 02",
    name: "CLOTHES & HAUTE COUTURE",
    items: [
      {
        lotId: "201",
        brand: "YOHJI YAMAMOTO",
        name: 'Deconstructed Wool Gabardine Trench (FW 1991 "War & Peace")',
        startingBid: 4500,
        estimate: "$7,000 – $10,000",
        img: "/assets/images/lot-201.jpg",
        specs: [
          { label: "Cloth", value: "Wool Gabardine" },
          { label: "Cut", value: "Deconstructed" },
          { label: "Season", value: "FW 1991" },
          { label: "Custody", value: "Paris Vault #03" },
        ],
      },
      {
        lotId: "202",
        brand: "SAINT LAURENT RIVE GAUCHE",
        name: "Vintage 1968 Saharienne Safari Jacket in Heavy Cotton Twill",
        startingBid: 5000,
        estimate: "$8,000 – $12,000",
        img: "/assets/images/lot-202.jpg",
        specs: [
          { label: "Cloth", value: "Heavy Cotton Twill" },
          { label: "Era", value: "1968" },
          { label: "Condition", value: "Vintage Excellent" },
          { label: "Custody", value: "Normandy Estate" },
        ],
      },
    ],
  },
  {
    id: "dept-03",
    department: "Dept. 03",
    name: "JEWELRY & GEMSTONES",
    items: [
      {
        lotId: "301",
        brand: "VAN CLEEF & ARPELS",
        name: '"Zip Antique" Transformable Necklace in Platinum with Sapphires',
        startingBid: 180000,
        estimate: "$250,000 – $350,000",
        img: "/assets/images/lot-301.png",
        specs: [
          { label: "Metal", value: "Platinum" },
          { label: "Stones", value: "Sapphires & Diamonds" },
          { label: "Type", value: "Transformable Necklace" },
          { label: "Custody", value: "Geneva Vault #01" },
        ],
      },
    ],
  },
  {
    id: "dept-04",
    department: "Dept. 04",
    name: "LUXURY TIMEPIECES",
    items: [
      {
        lotId: "401",
        brand: "PATEK PHILIPPE",
        name: "Ref. 5004P Platinum Split-Second Perpetual Calendar Chronograph",
        startingBid: 220000,
        estimate: "$300,000 – $420,000",
        img: "/assets/images/lot-401.jpg",
        specs: [
          { label: "Case", value: "Platinum 40mm" },
          { label: "Calibre", value: "CH 29-527 Perpetual" },
          { label: "Complication", value: "Split-Second Chronograph" },
          { label: "Custody", value: "Zurich Vault #04" },
        ],
      },
    ],
  },
];

// UMD export: browser global + Node module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VELA_CATALOG };
}
if (typeof window !== 'undefined') {
  window.VELA_CATALOG = VELA_CATALOG;
}
