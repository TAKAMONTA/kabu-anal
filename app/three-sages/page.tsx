import ThreeSagesAnalysis from "@/app/components/ThreeSagesAnalysis";
import Header from "@/app/components/Header";

interface ThreeSagesPageProps {
  searchParams: { symbol?: string; auto?: string };
}

export default function ThreeSagesPage({ searchParams }: ThreeSagesPageProps) {
  return (
    <>
      <Header />
      <ThreeSagesAnalysis
        initialSymbol={searchParams.symbol}
        autoStart={searchParams.auto === "true"}
      />
    </>
  );
}
