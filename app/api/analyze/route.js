import pdf from "pdf-parse";
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
You are an ATS + hiring manager.

IMPORTANT:
Even if the candidate is NOT a good fit (SKIP),
you MUST still provide meaningful, detailed, and useful output.

----------------------------------------
MANDATORY OUTPUT RULES
----------------------------------------
- NEVER leave any field empty
- ALWAYS provide at least:
  - 3 reasons
  - all missing skills
  - 3 improvement steps
- Even for "skip", give constructive, actionable insights
- DO NOT return placeholders or vague answers
----------------------------------------
EXPERIENCE MATCH (STRICT RULE)
----------------------------------------

1. Extract required experience in years from the job description.
   - Example: "1+ years", "2 years", "3-5 years"

2. Extract candidate's total relevant experience in years from the resume.

3. Compute experience ratio:

experience_ratio = candidate_experience / required_experience

4. Compute base score:

IF experience_ratio >= 1:
  base_experience_score = 100
ELSE:
  base_experience_score = experience_ratio * 100

5. Adjust for relevance:
- If experience is highly relevant → keep score
- If partially relevant → reduce by 10–30%
- If mostly irrelevant → reduce by 40–60%

6. Final experience_match = rounded integer (0–100)

IMPORTANT:
- Do NOT reward excessive years beyond requirement (cap at 100)
- Do NOT assume experience if not clearly mentioned
- Be conservative and realistic

----------------------------------------
FINAL MATCH SCORE
----------------------------------------

match_score =
(skills_match * 0.5) +
(experience_match * 0.3) +
(keyword_match * 0.2)

ROUND to nearest integer

Return ONLY JSON:

{
  "decision": "apply" | "skip",
  "match_score": number (0-100),
   "confidence": number(0-100),
  "ats_risk": "low" | "medium" | "high",
  "breakdown": {
    "skills_match": number,
    "experience_match": number,
    "keyword_match": number
  },
  "competitiveness": "low" | "medium" | "high",
  "reasons": [],
  "missing_skills": [],
  "recruiter_pov": "",
  "improvement_plan": [],
    "harsh_truth": "One brutally honest but helpful sentence"
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