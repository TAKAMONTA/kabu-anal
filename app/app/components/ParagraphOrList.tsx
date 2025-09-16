"use client";

interface Props {
  text: string;
}

export default function ParagraphOrList({ text }: Props) {
  // Markdownの記号を削除し、きれいなテキストに整形
  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // **太字** を削除
      .replace(/\*(.*?)\*/g, "$1") // *イタリック* を削除
      .replace(/#{1,6}\s/g, "") // # 見出し記号を削除
      .trim();
  };

  const lines = text
    .split("\n")
    .map((line) => formatText(line.trim()))
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return <p className="text-slate-500 italic">データなし</p>;
  }

  return (
    <div className="space-y-2 leading-relaxed">
      {lines.map((line, idx) => {
        // 箇条書きの判定と整形
        if (line.match(/^[-*・]\s*/)) {
          const cleanLine = line.replace(/^[-*・]\s*/, "");
          return (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1 text-sm">•</span>
              <span className="text-slate-700 text-sm flex-1">{cleanLine}</span>
            </div>
          );
        }

        // 通常の段落
        return (
          <p key={idx} className="text-slate-700 text-sm leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}
