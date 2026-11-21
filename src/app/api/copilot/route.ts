import { NextRequest, NextResponse } from 'next/server';
import { generateArchitectureFromPrompt } from '@/lib/copilot/architectureGenerator';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Valid prompt is required' }, { status: 400 });
    }
    const architecture = generateArchitectureFromPrompt(prompt);
    return NextResponse.json(architecture);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate architecture' }, { status: 500 });
  }
}
