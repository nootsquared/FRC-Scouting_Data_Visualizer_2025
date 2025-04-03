import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { fileName, data } = await request.json();
    
    // Validate input
    if (!fileName || !data) {
      return NextResponse.json({ error: 'Missing fileName or data' }, { status: 400 });
    }
    
    // Ensure the fileName is one of the allowed files
    const allowedFiles = ['pit-scouting-data.json', 'scouting-data.json', 'scouting-data-pre.json'];
    if (!allowedFiles.includes(fileName)) {
      return NextResponse.json({ error: 'Invalid fileName' }, { status: 400 });
    }
    
    // Validate data structure
    if (!data.matches || !Array.isArray(data.matches)) {
      return NextResponse.json({ error: 'Invalid data structure. Expected { matches: [] }' }, { status: 400 });
    }
    
    // Get the absolute path to the data directory
    const dataDir = path.join(process.cwd(), 'src', 'data');
    
    // Ensure the data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write the file
    const filePath = path.join(dataDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true, message: `File ${fileName} saved successfully` });
  } catch (error) {
    console.error('Error saving JSON file:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
} 