"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import FloatingInput from "./FloatingInput";

interface FloatingPasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label:  string;
  error?: string;
  shake?: boolean;
}

const FloatingPasswordInput = forwardRef<HTMLInputElement, FloatingPasswordInputProps>(
  ({ label, error, shake, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);

    const toggle = (
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-0.5"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    );

    return (
      <FloatingInput
        ref={ref}
        label={label}
        error={error}
        shake={shake}
        type={visible ? "text" : "password"}
        suffix={toggle}
        {...rest}
      />
    );
  }
);

FloatingPasswordInput.displayName = "FloatingPasswordInput";
export default FloatingPasswordInput;
