import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import StepIndicator from "./StepIndicator";
import Step1Media from "./steps/Step1Media";
import Step2AIAnalysis from "./steps/Step2AIAnalysis";
import Step3Location from "./steps/Step3Location";
import Step4Details from "./steps/Step4Details";
import Step5Review from "./steps/Step5Review";

const STEP_LABELS = ["Media", "AI Vision", "Location", "Details", "Review"];
const TOTAL_STEPS = 5;

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
  }),
};

export const ReportWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const goNext = () => {
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Media onNext={goNext} />;
      case 2:
        return <Step2AIAnalysis onNext={goNext} onBack={goBack} />;
      case 3:
        return <Step3Location onNext={goNext} onBack={goBack} />;
      case 4:
        return <Step4Details onNext={goNext} onBack={goBack} />;
      case 5:
        return <Step5Review onBack={goBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Report a Community Issue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Powered by Gemini Vision AI · Secure · Realtime
          </p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            labels={STEP_LABELS}
          />
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-6"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
export default ReportWizard;
