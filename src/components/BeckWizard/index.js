import React, { useState } from 'react';
import StepOne from './steps/StepOne';
import StepTwo from './steps/StepTwo';
import StepThree from './steps/StepThree';

const BeckWizard = () => {
  const [wizardPage, setWizardPage] = useState(1);

  const steps = {
    // 1: <StepOne changeStep={setWizardPage} />,
    // 2: <StepTwo changeStep={setWizardPage} />,
    1: <StepThree changeStep={setWizardPage} />,
  }

  return steps[wizardPage];
}

export default BeckWizard;
