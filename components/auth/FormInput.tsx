import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, id, ...props }) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full h-10 px-4 text-sm font-bold text-white bg-[#020617] border border-slate-800 rounded-lg placeholder:text-slate-600 placeholder:text-xs placeholder:font-normal focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0f172a] outline-none transition-all"
      />
    </div>
  );
};
