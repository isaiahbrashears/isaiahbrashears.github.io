import React, { useState } from 'react';
import StepOne from './steps/StepOne';
import StepTwo from './steps/StepTwo';

const BeckWizard = () => {
  const [wizardPage, setWizardPage] = useState(1);

  const steps = {
    1: <StepOne changeStep={setWizardPage} />,
    // 1: <StepTwo changeStep={setWizardPage} />,
  }

  return steps[wizardPage];
}

export default BeckWizard;
