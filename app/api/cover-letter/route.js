import  pdf from "pdf-parse-new";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const job = formData.get("job");

    if (!file || !job) {
      return Response.json(
        { error: "Missing file or job description" },
        { status: 400 }
      );
    }

    // ✅ Parse PDF again here
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdf(buffer);
    const resumeText = data.text;

    if (!resumeText || resumeText.length < 50) {
      return Response.json({
        error: "Could not extract text from PDF",
      });
    }

    // 🧠 Prompt
    const prompt = `
You are NOT an AI.

You are a real candidate writing a thoughtful, specific cover letter with specific keywords and projects if mentioned in the job description and resume.

Rules:
- No generic phrases
- No buzzwords
- Sound and look human
- no double dash or informal words to be used
- Be concise (200–300 words)

Resume:
${resumeText}

Job:
${job}
`;

    const aiRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 600,
        }),
      }
    );

    const aiData = await aiRes.json();

    return Response.json({
      coverLetter: aiData.result?.response || "",
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}