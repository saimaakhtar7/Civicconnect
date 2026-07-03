import React from "react";
import { TrustTier } from "../../types/user.types";
import { TRUST_TIERS } from "../../config/constants";
import { Award, Shield, Zap, Sparkles, Star } from "lucide-react";

interface TrustBadgeProps {
  tier: TrustTier;
  score?: number;
  className?: string;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ tier, score, className = "" }) => {
  const config = TRUST_TIERS.find((t) => t.value === tier) || TRUST_TIERS[0];

  const getIcon = () => {
    switch (tier) {
      case "platinum":
        return <Sparkles className="w-3.5 h-3.5 mr-1" />;
      case "gold":
        return <Award className="w-3.5 h-3.5 mr-1" />;
      case "silver":
        return <Star className="w-3.5 h-3.5 mr-1" />;
      case "bronze":
        return <Zap className="w-3.5 h-3.5 mr-1" />;
      default:
        return <Shield className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.badgeColor} ${className}`}
    >
      {getIcon()}
      {config.label}
      {score !== undefined && <span className="ml-1 opacity-75">({score})</span>}
    </span>
  );
};
