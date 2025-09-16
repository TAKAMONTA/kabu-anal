"use client";

interface FinanceDataPoint {
  year: string;
  revenue: number;
  operating: number;
  net: number;
  roe: number;
  per: number;
  pbr: number;
  dividend: number;
}

interface Props {
  data: FinanceDataPoint[];
  range: "3y" | "5y" | "all";
}

export default function FinanceTable({ data, range }: Props) {
  // 期間に応じてデータをフィルタリング
  const filteredData = (() => {
    if (range === "3y") return data.slice(-3);
    if (range === "5y") return data.slice(-5);
    return data;
  })();

  if (filteredData.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 text-indigo-700 flex items-center">
          <span className="mr-2">📊</span>財務データ
        </h3>
        <p className="text-slate-500 text-center py-4">データなし</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 text-indigo-700 flex items-center">
        <span className="mr-2">📊</span>財務データ
      </h3>

      <div className="overflow-x-auto">
        <table className="table-auto border-collapse border border-slate-300 w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="border border-slate-300 px-3 py-2 text-left">
                年度
              </th>
              <th className="border border-slate-300 px-3 py-2 text-right">
                売上高
                <br />
                <span className="text-xs text-slate-500">(億円)</span>
              </th>
              <th className="border border-slate-300 px-3 py-2 text-right">
                営業利益
                <br />
                <span className="text-xs text-slate-500">(億円)</span>
              </th>
              <th className="border border-slate-300 px-3 py-2 text-right">
                純利益
                <br />
                <span className="text-xs text-slate-500">(億円)</span>
              </th>
              <th className="border border-slate-300 px-3 py-2 text-right">
                ROE
                <br />
                <span className="text-xs text-slate-500">(%)</span>
              </th>
              <th className="border border-slate-300 px-3 py-2 text-right">
                PER
                <br />
                <span className="text-xs text-slate-500">(倍)</span>
              </th>
              <th className="border border-slate-300 px-3 py-2 text-right">
                配当利回り
                <br />
                <span className="text-xs text-slate-500">(%)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="border border-slate-300 px-3 py-2 font-semibold">
                  {item.year}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {Math.round(item.revenue / 100).toLocaleString()}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {Math.round(item.operating / 100).toLocaleString()}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {Math.round(item.net / 100).toLocaleString()}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {item.roe}%
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {item.per}倍
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {item.dividend}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700 flex items-center">
          <span className="mr-1">ℹ️</span>
          財務データは最新の決算情報に基づいています。ROE=株主資本利益率、PER=株価収益率。
        </p>
      </div>
    </div>
  );
}
