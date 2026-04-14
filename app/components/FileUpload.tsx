import { useRef } from "react";

export default function FileUpload({ file, setFile }: any) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="
        cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition
        bg-zinc-50 border-zinc-300 hover:border-zinc-400
        dark:bg-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-500
      "
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0])}
        className="hidden"
      />

      {!file ? (
        <div className="space-y-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Click to upload your resume
          </p>
          <p className="text-xs text-zinc-400">
            PDF only • Max 5MB
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            ✓ {file.name}
          </p>
          <p className="text-xs text-zinc-500">
            Click to change file
          </p>
        </div>
      )}
    </div>
  );
}