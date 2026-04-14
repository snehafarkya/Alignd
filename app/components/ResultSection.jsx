export default function ResultSection({ title, data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2">
        {title}
      </h3>
      <ul className="list-disc ml-6 space-y-1 text-zinc-300">
        {data.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}