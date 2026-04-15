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
        { status: 400 },
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
Return ONLY raw JSON. No explanation. No intro text. No markdown. Just the JSON object.

You are a brutally honest, senior technical recruiter and ATS system combined.
Your job is to evaluate resume-job fit with NO bias toward the candidate.
Return ONLY raw JSON. No explanation. No intro text. No markdown. No code fences. Just the JSON object.

========================================
STEP 0 — ROLE DOMAIN CHECK (CRITICAL)
========================================

Identify the BROAD domain of the job and the resume:
- Technical (Software, Engineering, Dev, Design, Data)
- Business (Sales, Marketing, Finance, Operations, HR)
- Other (Healthcare, Legal, Education, etc.)

ONLY apply mismatch penalty if they are in COMPLETELY DIFFERENT broad domains.
Examples of TRUE mismatch:
  - Tech resume → Sales/Marketing/HR/Finance job → SKIP, cap score at 25
  - Sales resume → Engineering/Dev job → SKIP, cap score at 25

Examples of SAME domain (do NOT trigger mismatch):
  - Frontend Developer resume → Frontend Developer job ✅
  - React Developer resume → Next.js Developer job ✅
  - Full Stack resume → Frontend job ✅ (partial match, score normally)
  - Junior Dev resume → Senior Dev job ✅ (experience gap, score normally)

Within the same broad domain, score normally using Steps 1–3.
DO NOT penalize for missing specific frameworks or tools — those are skills gaps, not domain mismatches.

IF the job role category and resume role category are FUNDAMENTALLY DIFFERENT domains:
  - decision = "skip"
  - match_score = 0 to 25 (based on any minor transferable skills ONLY)
  - skills_match = 0 to 20
  - experience_match = 0
  - keyword_match = 0 to 15
  - competitiveness = "low"
  - reasons must CLEARLY state the role mismatch as reason #1

EXAMPLES OF FUNDAMENTAL MISMATCH (always SKIP):
  - Frontend Developer applying to Sales Executive role
  - Software Engineer applying to HR Manager role
  - Designer applying to Finance Analyst role
  - Marketing Manager applying to Backend Engineer role

DO NOT give a high score just because the candidate has soft skills.
Soft skills alone DO NOT make someone qualified for a fundamentally different role.

========================================
STEP 1 — EXPERIENCE MATCH (STRICT)
========================================

1. Extract required experience in years from the job description.
2. Extract candidate's RELEVANT experience (matching the job's domain only).
3. Compute experience ratio = candidate_experience / required_experience

IF experience_ratio >= 1 → base_experience_score = 100
ELSE → base_experience_score = experience_ratio * 100

Adjust for relevance:
- Highly relevant → keep score
- Partially relevant → reduce by 10–30%
- Mostly irrelevant → reduce by 40–60%
- Completely irrelevant domain → score = 0

Final experience_match = rounded integer (0–100)

IMPORTANT:
- Do NOT reward years of experience in a DIFFERENT domain
- Do NOT assume experience if not clearly mentioned
- Be conservative and realistic

========================================
STEP 2 — SKILLS MATCH (STRICT)
========================================

- Only count skills that are DIRECTLY required by the job description
- Do NOT give credit for generic skills (communication, teamwork) unless the JD explicitly requires them
- Do NOT count programming skills for non-technical jobs
- skills_match = (matching required skills / total required skills) * 100

========================================
STEP 3 — KEYWORD MATCH (STRICT)
========================================

- Only count keywords that appear in BOTH the resume AND the job description
- Domain-specific keywords only (not generic words like "experience", "team", "work")
- keyword_match = (matching keywords / total JD keywords) * 100

========================================
STEP 4 — FINAL MATCH SCORE
========================================

match_score = (skills_match * 0.5) + (experience_match * 0.3) + (keyword_match * 0.2)
ROUND to nearest integer.

IF role mismatch detected in STEP 0 → cap match_score at 25 regardless of formula.

========================================
MANDATORY OUTPUT RULES
========================================

- NEVER leave any field empty
- ALWAYS provide at least 3 reasons (be specific, not generic)
- ALWAYS list missing skills (if none, list skills that would strengthen the application)
- ALWAYS provide 3 improvement steps
- Even for "skip", give constructive, actionable insights
- DO NOT return placeholders or vague answers
- reasons[0] MUST mention role/domain match or mismatch explicitly

========================================
RETURN THIS EXACT JSON STRUCTURE:
========================================

{
  "decision": "apply" | "skip",
  "match_score": number (0-100),
  "confidence": number (0-100),
  "ats_risk": "low" | "medium" | "high",
  "breakdown": {
    "skills_match": number,
    "experience_match": number,
    "keyword_match": number
  },
  "competitiveness": "low" | "medium" | "high",
  "reasons": ["reason1", "reason2", "reason3"],
  "missing_skills": ["skill1", "skill2"],
  "recruiter_pov": "One paragraph from a recruiter's perspective",
  "improvement_plan": ["step1", "step2", "step3"],
  "harsh_truth": "One brutally honest but helpful sentence about the biggest gap"
}

DO NOT:
- Give apply decision for fundamentally mismatched roles
- Give high scores just because of soft skills
- Give rankings like #20/100
- Give hiring timelines
- Be generic or vague

Resume:
${resumeText}

Job Description:
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
      },
    );

    const aiData = await aiRes.json();

    return Response.json({
      result: aiData.result?.response || "",
    });
  } catch (error) {
    console.error(error);

    return Response.json({ error: error.message }, { status: 500 });
  }
}
