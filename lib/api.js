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
    return JSON.parse(data.result);
  } catch {
    return { error: "Parsing failed", raw: data };
  }
}