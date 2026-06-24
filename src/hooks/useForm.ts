import { useState } from 'react';

type ValidationRule = {
  required?: boolean;
  min?: number;
  max?: number;
  isNumeric?: boolean;
  custom?: (value: any) => string | null;
};

type RulesMap<T> = {
  [K in keyof T]?: ValidationRule;
};

export function useForm<T extends Record<string, any>>(initialValues: T, rules?: RulesMap<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    if (!rules) return true;
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const key in rules) {
      const rule = rules[key];
      const value = values[key];
      
      if (rule?.required && (value === undefined || value === null || value === '')) {
        newErrors[key] = 'This field is required';
        isValid = false;
        continue;
      }
      
      if (rule?.isNumeric && isNaN(Number(value))) {
        newErrors[key] = 'Must be a valid number';
        isValid = false;
        continue;
      }

      if (rule?.min !== undefined && Number(value) < rule.min) {
        newErrors[key] = `Minimum value is ${rule.min}`;
        isValid = false;
        continue;
      }

      if (rule?.max !== undefined && Number(value) > rule.max) {
        newErrors[key] = `Maximum value is ${rule.max}`;
        isValid = false;
        continue;
      }

      if (rule?.custom) {
        const customError = rule.custom(value);
        if (customError) {
          newErrors[key] = customError;
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    validate,
    reset,
    setValues
  };
}
