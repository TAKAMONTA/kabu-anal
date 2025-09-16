import { NextResponse } from "next/server";
import { StockApiResponse, ApiError } from "@/app/types/api";

// 全角→半角変換
function normalizeInput(input: string): string {
  return input.replace(/[０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  );
}

async function fetchYahooChart(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  if (!data.chart?.result) {
    throw new Error("Yahoo Financeからデータ取得に失敗しました");
  }

  const result = data.chart.result[0];
  const timestamps: number[] = result.timestamp;
  const closes: number[] = result.indicators.quote[0].close;
  const currency: string = result.meta.currency || "USD";

  const labels = timestamps.map((ts) => {
    const d = new Date(ts * 1000);
    return d.toISOString().split("T")[0];
  });

  return { labels, prices: closes, currency };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const inputRaw = searchParams.get("input");
  const input = normalizeInput(inputRaw || "").toUpperCase();

  if (!input) {
    return NextResponse.json(
      { error: "input クエリが必要です" },
      { status: 400 }
    );
  }

  try {
    let symbol = input;
    if (/^\d{4}$/.test(input)) {
      symbol = `${input}.T`; // 日本株は .T
    }

    const { labels, prices, currency } = await fetchYahooChart(symbol);

    const response: StockApiResponse = {
      symbol,
      price: prices[prices.length - 1],
      currency,
      labels,
      prices,
    };

    return NextResponse.json(response);
  } catch (error) {
    const errorResponse: ApiError = {
      error: error instanceof Error ? error.message : "株価取得に失敗しました",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
