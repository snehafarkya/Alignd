export async function analyzeResume(file, job) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("job", job);

  const res = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  try {
    const jsonMatch = data.result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { error: "Parsing failed", raw: data };
  }
}