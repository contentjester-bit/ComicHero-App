import type { DealScore } from "@/types/listing";

interface DealBadgeProps {
  dealScore: DealScore;
}

export function DealBadge({ dealScore }: DealBadgeProps) {
  if (dealScore.confidence === 0) return null;

  let bgColor: string;
  let textColor: string;
  let label: string;

  if (dealScore.percentBelowAverage >= 30) {
    bgColor = "bg-green-100";
    textColor = "text-green-800";
    label = `${dealScore.percentBelowAverage}% below avg`;
  } else if (dealScore.percentBelowAverage >= 15) {
    bgColor = "bg-emerald-50";
    textColor = "text-emerald-700";
    label = `${dealScore.percentBelowAverage}% below avg`;
  } else if (dealScore.percentBelowAverage >= 0) {
    bgColor = "bg-yellow-50";
    textColor = "text-yellow-700";
    label = "Fair price";
  } else {
    bgColor = "bg-red-50";
    textColor = "text-red-700";
    label = `${Math.abs(dealScore.percentBelowAverage)}% above avg`;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bgColor} ${textColor}`}
      title={dealScore.reason}
    >
      {label}
    </span>
  );
}
