import pdf from "pdf-parse-new";

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

    // Convert file → buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ✅ Parse PDF (SERVER SIDE)
    const data = await pdf(buffer);
    const resumeText = data.text;

    if (!resumeText || resumeText.length < 50) {
      return Response.json({
        error: "Could not extract meaningful text (possibly scanned PDF)",
      });
    }

    // 🧠 AI PROMPT
 const prompt = `
You are:
- A strict ATS system
- A hiring manager
- A career strategist

Your job:
Evaluate whether this candidate should APPLY or SKIP the job.

IMPORTANT:
- Be realistic, not optimistic
- Do NOT invent fake precision
- Avoid guessing timelines or ranking numbers

Return ONLY JSON:

{
  "decision": "apply" | "skip",
  "match_score": number (0-100),
  "breakdown": {
    "skills_match": number,
    "experience_match": number,
    "keyword_match": number
  },
  "competitiveness": "low" | "medium" | "high",
  "reasons": [],
  "missing_skills": [],
  "recruiter_pov": "",
  "improvement_plan": []
}

Rules:
- Skills match = based on required vs present skills
- Experience match = relevance of past work
- Keyword match = ATS keyword coverage
- Competitiveness = how strong the candidate is relative to typical applicants

DO NOT:
- Give rankings like #20/100
- Give hiring timelines
- Be generic

Resume:
${resumeText}

Job:
${job}
`;

    // 🔥 Cloudflare AI call
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
          max_tokens: 800,
        }),
      }
    );

    const aiData = await aiRes.json();

    return Response.json({
      result: aiData.result?.response || "",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}