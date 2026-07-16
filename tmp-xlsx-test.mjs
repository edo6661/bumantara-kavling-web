import JSZip from 'jszip';
import { writeFileSync, unlinkSync } from 'fs';

const escapeXml = (v) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const colLetter = (i) => String.fromCharCode(65 + i);
const inlineStrCell = (row, col, value) =>
  `<c r="${colLetter(col)}${row}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
const numberCell = (row, col, value) => `<c r="${colLetter(col)}${row}"><v>${value}</v></c>`;

const tukangList = [
  { nama: 'Budi & Co', nik: '3175010101010001', nominal: 1500000 },
  { nama: 'Siti', nik: '3175010101010002', nominal: 2000000 },
];

const headerRow = `<row r="1">${[
  inlineStrCell(1, 0, 'No'),
  inlineStrCell(1, 1, 'Nama'),
  inlineStrCell(1, 2, 'NIK'),
  inlineStrCell(1, 3, 'Upah'),
].join('')}</row>`;

const bodyRows = tukangList
  .map((t, i) => {
    const r = i + 2;
    return `<row r="${r}">${[
      numberCell(r, 0, i + 1),
      inlineStrCell(r, 1, t.nama),
      inlineStrCell(r, 2, t.nik),
      numberCell(r, 3, t.nominal),
    ].join('')}</row>`;
  })
  .join('');

const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${headerRow}${bodyRows}</sheetData>
</worksheet>`;

const zip = new JSZip();
zip.file(
  '[Content_Types].xml',
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
);
zip.file(
  '_rels/.rels',
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
);
zip.file(
  'xl/workbook.xml',
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Upah Tukang" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
);
zip.file(
  'xl/_rels/workbook.xml.rels',
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
);
zip.file('xl/worksheets/sheet1.xml', sheetXml);

const buf = await zip.generateAsync({ type: 'nodebuffer' });
writeFileSync('tmp-upah-test.xlsx', buf);

// verify zip contents
const check = await JSZip.loadAsync(buf);
const names = Object.keys(check.files).sort();
const sheet = await check.file('xl/worksheets/sheet1.xml').async('string');
console.log('files:', names.join(', '));
console.log('has Budi:', sheet.includes('Budi &amp; Co'));
console.log('has NIK:', sheet.includes('3175010101010001'));
console.log('bytes:', buf.length);
unlinkSync('tmp-upah-test.xlsx');
