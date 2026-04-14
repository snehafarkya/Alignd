export async function generateCoverLetter(file, job) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("job", job);

  const res = await fetch("/api/cover-letter", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  return data.coverLetter;
}