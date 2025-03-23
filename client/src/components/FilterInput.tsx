// client/src/components/FilterInput.tsx
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

interface FilterInputProps {
  placeholder?: string;
  onFilterChange: (value: string) => void;
  className?: string;
}

const FilterInput: React.FC<FilterInputProps> = ({
  placeholder = "Filter...",
  onFilterChange,
  className = "",
}) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    onFilterChange(value);
  }, [value, onFilterChange]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default FilterInput;
