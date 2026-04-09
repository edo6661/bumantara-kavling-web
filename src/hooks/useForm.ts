import { useState } from "react";

export const useForm = <T>(
  initialState: T,
  validateFn?: (values: T) => Partial<Record<keyof T, string>>,
) => {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === "number" ? (value === "" ? 0 : Number(value)) : value;

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));

    if (errors[name as keyof T]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof T,
  ) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({
      ...prev,
      [fieldName]: (file ? file.name : "") as unknown as T[keyof T],
    }));
  };

  const validate = () => {
    if (!validateFn) return true;
    const newErrors = validateFn(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(initialState);
    setErrors({});
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    handleChange,
    handleFileChange,
    validate,
    resetForm,
  };
};
