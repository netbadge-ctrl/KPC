import { MOCK_PLAN, MOCK_GENERATED_CODE } from '../constants';
import { PlanData } from '../types';

export const generatePlan = async (prompt: string): Promise<PlanData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_PLAN);
    }, 1500); // Simulate Planner delay
  });
};

export const generateCode = async (plan: PlanData): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_GENERATED_CODE);
    }, 2000); // Simulate Coder delay
  });
};

export const refineCode = async (currentCode: string, instruction: string): Promise<string> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simple mock refinement: just change button color for demo purposes if requested
            // otherwise return same code
            if(instruction.toLowerCase().includes('red') || instruction.toLowerCase().includes('danger')) {
                resolve(currentCode.replace('k-btn-primary', 'k-btn-danger').replace('background-color: #2563eb', 'background-color: #dc2626').replace('border-color: #2563eb', 'border-color: #dc2626'));
            } else {
                resolve(currentCode);
            }
        }, 1500);
    })
}