import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { PinataSDK } from 'pinata';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
console.log("pinata jwt:", process.env.PINATA_JWT);
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL!
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isAnalyze = formData.get('analyze') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Pinata
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a proper File object from the buffer
    const pinataFile = new File([buffer], file.name, { 
      type: file.type 
    });

    const pinataResponse:any = await pinata.upload.public.file(pinataFile, {
      metadata: {
        name: file.name
      },
    });
    console.log('Pinata response:', pinataResponse);
    console.log('IPFS CID:', pinataResponse.IpfsHash);
    const ipfsCid = pinataResponse.cid;

    let analysis:any = '';
    if (isAnalyze) {
      // Analyze with Gemini
      const base64Data = buffer.toString('base64');
      const contents = file.type === 'application/pdf'
        ? {
            inline_data: {
              mime_type: file.type,
              data: base64Data,
            },
            text: 'Analyze this medical record PDF for potential health risks or disease predictions. Focus on symptoms and provide a mock prediction (e.g., "Possible diabetes based on high blood sugar mentions"). Keep it concise and professional. Do not give real medical advice.'
          }
        : {
            text: `Analyze this medical record text for potential health risks or disease predictions. Focus on symptoms and provide a mock prediction (e.g., "Possible diabetes based on high blood sugar mentions"). Keep it concise and professional. Do not give real medical advice.\n\nText: ${buffer.toString('utf-8').substring(0, 2000)}`
          };

      const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
      });
      analysis = result.text;
    }

    return NextResponse.json({ ipfsCid, analysis });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}