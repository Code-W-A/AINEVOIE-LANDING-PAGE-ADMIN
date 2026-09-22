"use client";

import HorizontalTimelineStepper from "@/components/providers/HorizontalTimelineStepper";
import ProviderOnboardingFormWizard from "@/components/providers/ProviderOnboardingFormWizard";
import { useTranslations } from "next-intl";

type ProviderOnboardingFormCardProps = {
  currentStep: number;
  onStepChange: (step: number) => void;
};

export default function ProviderOnboardingFormCard({
  currentStep,
  onStepChange,
}: ProviderOnboardingFormCardProps) {
  const t = useTranslations("ProviderForm");

  return (
    <div className="border-border dark:bg-dark w-full rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
      <h2 className="mb-2 text-2xl font-semibold text-black dark:text-white">
        {t("cardTitle")}
      </h2>

      <div className="border-border mb-4 border-b pb-4 sm:mb-5 sm:pb-5">
        <HorizontalTimelineStepper currentStep={currentStep} />
        <p className="text-muted-foreground mt-3 text-sm">
          {currentStep <= 3
            ? t("stepHintPhaseOne", { step: currentStep })
            : t("stepHintPhaseTwo", { step: currentStep })}
        </p>
      </div>

      <ProviderOnboardingFormWizard
        currentStep={currentStep}
        onStepChange={onStepChange}
      />
    </div>
  );
}
