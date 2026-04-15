"use client";

import { useState } from "react";
import { analyzeResume } from "../lib/api";
import { generateCoverLetter } from "../lib/coverLetter";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import LoadingOverlay from "./components/LoadingOverlay";
import Image from "next/image";
import FileUpload from "./components/FileUpload";
import Footer from "./components/Footer";

export default function Home() {
  const [file, setFile] = useState(null);
  const [job, setJob] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [generating, setGenerating] = useState(false);

  // 🔍 Analyze
  const handleAnalyze = async () => {
    if (!file || !job) {
      alert("Upload resume and add job description");
      return;
    }

    setLoading(true);
    setResult(null);

    const res = await analyzeResume(file, job);

    // The API returns { result: "...raw JSON string..." }
    // We need to parse the inner string
    try {
      const raw = res.result || res; // handle both shapes
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      setResult(parsed);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      alert("Something went wrong parsing the result.");
    }

    setLoading(false);
  };

  // ✨ Cover Letter
  const handleCoverLetter = async () => {
    if (!file || !job) {
      alert("Upload resume and job description");
      return;
    }

    setGenerating(true);

    const res = await generateCoverLetter(file, job);
    setCoverLetter(res);

    setGenerating(false);
  };

  // 📄 Download PDF
  const downloadPDF = () => {
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    const marginX = 40;
    const marginY = 50;
    const maxWidth = 520;

    doc.setFont("Times", "Normal");
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(coverLetter, maxWidth);

    let y = marginY;

    lines.forEach((line) => {
      if (y > 800) {
        doc.addPage();
        y = marginY;
      }

      doc.text(line, marginX, y);
      y += 18; // line spacing
    });

    doc.save("cover-letter.pdf");
  };

  const downloadDocx = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1000,
                bottom: 1000,
                left: 1200,
                right: 1200,
              },
            },
          },
          children: coverLetter.split("\n").map(
            (para) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: para,
                    size: 24, // 12pt
                    font: "Times New Roman",
                  }),
                ],
                spacing: {
                  after: 200,
                },
              }),
          ),
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "cover-letter.docx");
  };
  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <LoadingOverlay show={loading || generating} />
      {/* HEADER */}
      <div className="max-w-4xl mx-auto mb-10">
        <h1 className="text-4xl flex items-center gap-3 font-bold tracking-tight">
          <Image src="/alignd-icon.svg" width={40} height={40} alt="Alignd" />
          AI Resume Analyzer & Cover Letter Generator
        </h1>
        <p className="text-zinc-400 mt-2">
          Know if you should apply, how to improve instantly, and get a tailored
          cover letter in seconds.
        </p>
      </div>

      {/* INPUT CARD */}
      <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <FileUpload file={file} setFile={setFile} />

        <textarea
          placeholder="Paste Job Description"
          className="w-full p-4 bg-zinc-950 rounded-xl border border-zinc-800 focus:outline-none"
          rows={10}
          value={job}
          onChange={(e) => setJob(e.target.value)}
        />

        {/* ACTION BUTTONS */}
        <div className="flex gap-4">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

          <button
            onClick={handleCoverLetter}
            disabled={generating}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-xl transition disabled:opacity-50"
          >
            {generating ? "Generating..." : "Cover Letter"}
          </button>
        </div>
      </div>

      {/* RESULTS */}
      {result && (
        <div className="max-w-4xl mx-auto mt-10 space-y-6">
          {/* ================= DECISION ================= */}
          <div
            className="
      p-6 rounded-2xl
      bg-white border border-zinc-200
      dark:bg-zinc-900 dark:border-zinc-800
    "
          >
            <h2 className="text-3xl font-bold">
              {result.decision === "apply" ? "✅ APPLY" : "❌ SKIP"}
            </h2>

            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 flex gap-4 flex-wrap">
              <span>Match Score: {result.match_score}%</span>
              <span>Confidence: {result.confidence}%</span>
              <span className="capitalize">ATS Risk: {result.ats_risk}</span>
            </div>

            {/* Breakdown */}
            <div className="mt-4 text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
              <p>Skills Match: {result.breakdown?.skills_match}%</p>
              <p>Experience Match: {result.breakdown?.experience_match}%</p>
              <p>Keyword Match: {result.breakdown?.keyword_match}%</p>
            </div>

            {/* Reasons */}
            <ul className="mt-4 list-disc ml-6 text-zinc-700 dark:text-zinc-300">
              {result.reasons?.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* ================= GRID ================= */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Competitiveness */}
            <Card title="Competitiveness">
              <span className="capitalize">{result.competitiveness}</span>
            </Card>

            {/* Recruiter POV */}
            <Card title="Recruiter POV">
              <i>{result.recruiter_pov}</i>
            </Card>

            {/* Missing Skills */}
            <Card title="Missing Skills">
              <ul className="list-disc ml-4">
                {result.missing_skills?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>

            {/* Improvement Plan */}
            <Card title="Improvement Plan">
              <ul className="list-disc ml-4">
                {result.improvement_plan?.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </Card>
          </div>

          {/* ================= QUICK FIXES ================= */}
          {result.quick_fixes?.length > 0 && (
            <div
              className="
        p-5 rounded-2xl
        bg-green-50 border border-green-200
        dark:bg-green-900/20 dark:border-green-800
      "
            >
              <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">
                Quick Fixes (High Impact)
              </h3>

              <ul className="list-disc ml-4 text-green-700 dark:text-green-300">
                {result.quick_fixes.map((fix, i) => (
                  <li key={i}>{fix}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ================= HARSH TRUTH ================= */}
          {result.harsh_truth && (
            <div
              className="
        p-5 rounded-2xl
        bg-red-50 border border-red-200
        dark:bg-red-900/20 dark:border-red-800
      "
            >
              <h3 className="font-semibold mb-2 text-red-700 dark:text-red-400">
                Reality Check
              </h3>

              <p className="text-red-700 dark:text-red-300">
                {result.harsh_truth}
              </p>
            </div>
          )}

          {/* ================= DISCLAIMER ================= */}
          <p className="text-xs text-zinc-500 mt-4">
            These insights are AI-assisted estimates based on resume-job
            alignment. Actual hiring decisions depend on recruiter preferences
            and candidate pool.
          </p>
        </div>
      )}
      {/* COVER LETTER */}
      {coverLetter && (
        <div
          className="max-w-4xl mx-auto mt-10 p-6 bg-white border-zinc-200 text-zinc-700
dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 rounded-2xl"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Cover Letter</h3>

            <div className="flex gap-3 mt-4">
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-zinc-700 rounded-lg text-sm"
              >
                Download PDF
              </button>

              <button
                onClick={downloadDocx}
                className="px-4 py-2 bg-blue-600 rounded-lg text-sm"
              >
                Download DOCX
              </button>
            </div>
          </div>

          <p className="mt-4 text-zinc-300 whitespace-pre-line leading-relaxed">
            {coverLetter}
          </p>
        </div>
      )}
      <Footer />
    </main>
  );
}

// Reusable Card
function Card({ title, children }) {
  return (
    <div
      className="
      p-5 rounded-2xl
      bg-white border border-zinc-200
      dark:bg-zinc-900 dark:border-zinc-800
    "
    >
      <h3 className="font-semibold mb-2 text-black dark:text-white">{title}</h3>

      <div className="text-zinc-700 dark:text-zinc-300">{children}</div>
    </div>
  );
}
