import { AssemblyAI } from "assemblyai";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET_NAME = "meeting-audio";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!(audioFile instanceof File)) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }

    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!assemblyApiKey) {
      return NextResponse.json(
        { error: "ASSEMBLYAI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const admin = createAdminClient();
    const safeName = audioFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const objectPath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(objectPath, audioBuffer, {
        contentType: audioFile.type || "audio/mpeg",
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: signedUrlData, error: signedUrlError } = await admin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(objectPath, 60 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: signedUrlError?.message || "Could not create signed URL." },
        { status: 500 },
      );
    }

    const assembly = new AssemblyAI({
      apiKey: assemblyApiKey,
    });

    const transcript = await assembly.transcripts.transcribe({
      audio: signedUrlData.signedUrl,
      speech_model: "best",
    });

    if (!transcript.text) {
      return NextResponse.json(
        { error: "Transcription completed without text." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      audioPath: objectPath,
      transcript: transcript.text,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
