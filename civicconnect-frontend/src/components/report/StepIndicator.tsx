import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps, labels }) => {
  return (
    <div className="flex items-center w-full">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <React.Fragment key={step}>
            {/* Step Circle */}
            <div className="flex flex-col items-center shrink-0">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.15 : 1,
                }}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? "bg-civic-blue border-civic-blue text-white"
                    : isActive
                    ? "bg-white border-civic-blue text-civic-blue shadow-md shadow-blue-100"
                    : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step}
              </motion.div>
              <span
                className={`mt-1 text-[10px] font-semibold hidden sm:block ${
                  isActive ? "text-civic-blue" : isCompleted ? "text-gray-500" : "text-gray-300"
                }`}
              >
                {labels[i]}
              </span>
            </div>

            {/* Connector Line */}
            {step < totalSteps && (
              <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-gray-200">
                <motion.div
                  className="h-full bg-civic-blue"
                  initial={{ width: "0%" }}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
export default StepIndicator;
