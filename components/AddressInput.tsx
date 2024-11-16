import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface AddressInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export function AddressInput({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    console.log("Pasted URL:", pastedText);

    // Check if it's a Google Maps URL
    if (
      pastedText.includes("maps.app.goo.gl") ||
      pastedText.includes("goo.gl") ||
      pastedText.includes("google.com/maps")
    ) {
      e.preventDefault();

      // Show loading state
      onChange("Loading address...");

      try {
        const response = await fetch("/api/expand-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: pastedText }),
        });

        const data = await response.json();
        console.log("Response data:", data);

        if (response.ok && data.address) {
          onChange(data.address);
        } else {
          console.error("Error:", data.error);
          onChange(""); // Clear loading state
          alert(
            "Could not get address from URL. Please try entering it manually."
          );
        }
      } catch (error) {
        console.error("Error processing URL:", error);
        onChange(""); // Clear loading state
        alert(
          "Error processing URL. Please try entering the address manually."
        );
      }
    }
  };

  useEffect(() => {
    if (!inputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "place_id"],
      types: ["address"],
      componentRestrictions: { country: ["us", "ca"] },
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      console.log("Selected place:", place);
      if (place.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (listener) google.maps.event.removeListener(listener);
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        className={error ? "border-red-500" : ""}
        placeholder={placeholder}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
