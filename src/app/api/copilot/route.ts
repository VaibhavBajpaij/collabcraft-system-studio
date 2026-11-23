import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateArchitectureFromPrompt } from '@/lib/copilot/architectureGenerator';

// Fix P1.6: Validate prompt payload with Zod schema and length bounds
const CopilotSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, 'Architecture prompt must be at least 3 characters')
    .max(3000, 'Architecture prompt cannot exceed 3000 characters')
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = CopilotSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const architecture = generateArchitectureFromPrompt(result.data.prompt);
    return NextResponse.json(architecture);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate architecture' }, { status: 500 });
  }
}
