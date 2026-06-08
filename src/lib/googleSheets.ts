/**
 * Google Sheets API Integration Helper
 * Provides lightweight spreadsheet reading, template generation, and parsing utilities.
 */

export interface SheetPricingItem {
  id: string;
  name: string;
  subName: string;
  emoji: string;
  emart: number;
  good: number;
  olle: number;
  joggot: number;
  martro: number;
  lastUpdated?: string;
}

// 8 Items default templates with emojis
export const DEFAULT_ITEMS_DATA = [
  { id: 'egg', name: '계란 대란 30구', subName: '대형마트 6,980원', emoji: '🥚', emart: 6980, good: 5480, olle: 5900, joggot: 6100, martro: 6300, lastUpdated: '2026-06-08 11:30' },
  { id: 'milk', name: '우유 1L', subName: '대형마트 2,080원', emoji: '🥛', emart: 2080, good: 2200, olle: 2300, joggot: 2250, martro: 2150, lastUpdated: '2026-06-08 11:30' },
  { id: 'pork', name: '삼겹살 200g', subName: '대형마트 2,960원', emoji: '🐷', emart: 2960, good: 3960, olle: 4200, joggot: 4400, martro: 3180, lastUpdated: '2026-06-08 11:30' },
  { id: 'neck', name: '목살 200g', subName: '대형마트 2,760원', emoji: '🥩', emart: 2760, good: 3760, olle: 3500, joggot: 3800, martro: 2980, lastUpdated: '2026-06-08 11:30' },
  { id: 'garlic', name: '깐마늘 200g', subName: '대형마트 2,480원', emoji: '🧄', emart: 2480, good: 2100, olle: 1800, joggot: 1900, martro: 2200, lastUpdated: '2026-06-08 11:30' },
  { id: 'tofu', name: '찌개두부 300g', subName: '대형마트 1,280원', emoji: '🍲', emart: 1280, good: 990, olle: 800, joggot: 750, martro: 1100, lastUpdated: '2026-06-08 11:30' },
  { id: 'pumpkin', name: '애호박 1개', subName: '대형마트 1,280원', emoji: '🥒', emart: 1280, good: 1100, olle: 1200, joggot: 990, martro: 1150, lastUpdated: '2026-06-08 11:30' },
  { id: 'mushroom', name: '팽이버섯 1봉', subName: '대형마트 680원', emoji: '🍄', emart: 680, good: 500, olle: 450, joggot: 500, martro: 550, lastUpdated: '2026-06-08 11:30' }
];

/**
 * Extracts spreadsheet ID from a Google Sheets URL or returns the input if it's already an ID.
 */
export function extractSpreadsheetId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return urlOrId.trim();
}

/**
 * Generates CSV string of the pricing table.
 * Perfect for copy-pasting to Google Sheets.
 */
export function generateCSVTemplate(items: SheetPricingItem[]): string {
  const headers = ['ID', '품목명', '이름데코', '대형마트', '좋은마트', '우리올레', '조끄뜨레', '마트로', '마지막업데이트'];
  const rows = items.map(item => [
    item.id,
    item.name,
    item.emoji,
    item.emart,
    item.good,
    item.olle,
    item.joggot,
    item.martro,
    item.lastUpdated || new Date().toISOString().split('T')[0]
  ]);

  return [headers, ...rows].map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
}

/**
 * Loads data from a public Google Sheet using the Viz Query endpoint.
 * Bypasses OAuth/API Key requirements as long as the sheet is shared as "Anyone with link can view".
 */
export async function loadPublicGoogleSheet(spreadsheetId: string): Promise<SheetPricingItem[]> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Sheets 서버 응답 에러 (${res.status})`);
  }
  
  const txt = await res.text();
  const match = txt.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
  if (!match) {
    throw new Error('Google Sheets 데이터 양식이 유효하지 않습니다. 외부 공유 설정을 확인해 주세요.');
  }

  try {
    const json = JSON.parse(match[1]);
    const table = json.table;
    if (!table || !table.rows) {
      throw new Error('스프레드시트에 가져올 데이터 행이 없습니다.');
    }

    const cols: Array<{ label: string }> = table.cols || [];
    const rows: Array<{ c: Array<{ v: any; f?: string } | null> }> = table.rows;

    // Find indices based on headers
    const headerRow = cols.map(c => (c.label || '').toLowerCase().replace(/\s/g, ''));
    
    // Map property keys to index
    let idIdx = -1;
    let nameIdx = -1;
    let emojiIdx = -1;
    let emartIdx = -1;
    let goodIdx = -1;
    let olleIdx = -1;
    let joggotIdx = -1;
    let martroIdx = -1;
    let updateIdx = -1;

    // Fallback if cols headers are empty or default (A, B, C...)
    // We look at the first row elements if needed.
    const firstRowValues = rows[0]?.c?.map(cell => String(cell?.v || '').toLowerCase().trim()) || [];

    // Let's check headers
    for (let i = 0; i < Math.max(headerRow.length, firstRowValues.length); i++) {
      const header = (headerRow[i] || firstRowValues[i] || '').replace(/[^a-zA-Z0-9가-힣]/g, '');
      if (header.includes('id')) idIdx = i;
      else if (header.includes('품목') || header.includes('이름') || header.includes('name')) nameIdx = i;
      else if (header.includes('데코') || header.includes('이모') || header.includes('emoji')) emojiIdx = i;
      else if (header.includes('대형') || header.includes('이마트') || header.includes('emart')) emartIdx = i;
      else if (header.includes('좋은') || header.includes('good')) goodIdx = i;
      else if (header.includes('올레') || header.includes('olle')) olleIdx = i;
      else if (header.includes('조끄') || header.includes('joggot')) joggotIdx = i;
      else if (header.includes('마트로') || header.includes('martro')) martroIdx = i;
      else if (header.includes('업데이트') || header.includes('시점') || header.includes('날짜') || header.includes('last')) updateIdx = i;
    }

    // Default column fallback rules if nothing matches
    if (idIdx === -1) idIdx = 0;
    if (nameIdx === -1) nameIdx = 1;
    if (emojiIdx === -1) emojiIdx = 2;
    if (emartIdx === -1) emartIdx = 3;
    if (goodIdx === -1) goodIdx = 4;
    if (olleIdx === -1) olleIdx = 5;
    if (joggotIdx === -1) joggotIdx = 6;
    if (martroIdx === -1) martroIdx = 7;
    if (updateIdx === -1) updateIdx = 8;

    // Parse each row starting from index 0 (ifcols are in metadata) or 1 (if headers are in row 0)
    // Actually table.rows has ALL rows. If row 0 lists headers as values, we skip it.
    const isFirstRowHeader = firstRowValues.some(val => 
      val.includes('id') || val.includes('품목') || val.includes('대형') || val.includes('마트')
    );

    const parsedItems: SheetPricingItem[] = [];
    const startIndex = isFirstRowHeader ? 1 : 0;

    for (let r = startIndex; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.c) continue;

      const getVal = (idx: number, fallback: any = '') => {
        if (idx < 0 || idx >= row.c.length || !row.c[idx]) return fallback;
        const v = row.c[idx]?.v;
        return v === null || v === undefined ? fallback : v;
      };

      const id = String(getVal(idIdx)).trim();
      const name = String(getVal(nameIdx)).trim();
      if (!id || !name) continue;

      const emoji = String(getVal(emojiIdx, '📦')).trim();
      const emart = Number(getVal(emartIdx, 0)) || 0;
      const good = Number(getVal(goodIdx, 0)) || 0;
      const olle = Number(getVal(olleIdx, 0)) || 0;
      const joggot = Number(getVal(joggotIdx, 0)) || 0;
      const martro = Number(getVal(martroIdx, 0)) || 0;
      const lastUpdated = String(getVal(updateIdx, new Date().toISOString().split('T')[0])).trim();

      // Find initial subName based on emart price
      const subName = `대형마트 ${emart.toLocaleString()}원`;

      parsedItems.push({
        id,
        name,
        subName,
        emoji,
        emart,
        good,
        olle,
        joggot,
        martro,
        lastUpdated
      });
    }

    if (parsedItems.length === 0) {
      throw new Error('시트데이터에 유효한 정보가 없습니다.');
    }

    return parsedItems;
  } catch (error: any) {
    console.error('Google Sheets parse error:', error);
    throw new Error(error.message || '시트 데이터를 분석하는 도중 에러가 발생했습니다.');
  }
}
