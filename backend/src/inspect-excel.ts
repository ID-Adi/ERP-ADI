
import * as xlsx from 'xlsx';
import * as path from 'path';

const filePath = path.join(__dirname, '../../Docs/akun-perkiraan.xlsx');

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Collect unique "Tipe Akun"
    const types = new Set();
    const dataAll = xlsx.utils.sheet_to_json(worksheet);
    dataAll.forEach((row: any) => {
        if (row['Tipe Akun']) types.add(row['Tipe Akun']);
    });
    console.log('\n--- Unique Account Types ---');
    console.log(Array.from(types));

    // Read as JSON array of arrays (to see headers clearly)
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('--- Excel File Content (First 5 Rows) ---');
    console.log(JSON.stringify(data.slice(0, 5), null, 2));

    // Also try reading as object to see how keys are mapped
    const dataObj = xlsx.utils.sheet_to_json(worksheet, { header: 0 }); // header:0 means use first row as keys
    console.log('\n--- First Object (Mapped keys) ---');
    console.log(JSON.stringify(dataObj[0], null, 2));

} catch (error) {
    console.error('Error reading excel file:', error);
}
