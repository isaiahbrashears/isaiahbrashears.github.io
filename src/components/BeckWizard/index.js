import React, { useState } from 'react';
import StepOne from './steps/StepOne';
import StepTwo from './steps/StepTwo';
import StepThree from './steps/StepThree';
import StepFour from './steps/StepFour';

const BeckWizard = () => {
  const [wizardPage, setWizardPage] = useState(1);

  const steps = {
    1: <StepOne changeStep={setWizardPage} />,
    2: <StepTwo changeStep={setWizardPage} />,
    3: <StepThree changeStep={setWizardPage} />,
    4: <StepFour />
  }

  return steps[wizardPage];
}

export default BeckWizard;
