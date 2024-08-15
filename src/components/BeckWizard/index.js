import React, { useState } from 'react';
import StepOne from './steps/StepOne';

const BeckWizard = () => {
  const [wizardPage, setWizardPage] = useState(1);

  const steps = {
    1: <StepOne changeStep={setWizardPage} />,
    2: <StepOne changeStep={setWizardPage} />,
  }

  return steps[wizardPage];
}

export default BeckWizard;
