import  pdf from "pdf-parse";
export const runtime = "nodejs";

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
- Must include company name and role name in the cover letter
- make sure to end the cover letter like a standard one with a call to action and a thank you note.
- Contact info and likedin posrtfolio or github if available, should be included in the cover letter if mentioned in the resume.

Here is the job description and resume. Write a cover letter for this job based on the resume. If the resume doesn't have relevant experience, write a cover letter that focuses on transferable skills and enthusiasm for the role.
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