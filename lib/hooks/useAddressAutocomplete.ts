import { useRef, useEffect, useCallback } from "react";
import { debounce } from "lodash";

interface AutocompleteOptions {
  sessionToken?: google.maps.places.AutocompleteSessionToken;
  componentRestrictions?: google.maps.places.ComponentRestrictions;
}

export function useAddressAutocomplete(
  inputRef: React.RefObject<HTMLInputElement>,
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void,
  options?: AutocompleteOptions
) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken>();

  useEffect(() => {
    // Create a new session token
    sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

    return () => {
      sessionTokenRef.current = undefined;
    };
  }, []);

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current) return;

    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      fields: [
        "address_components",
        "formatted_address",
        "geometry",
        "place_id",
      ],
      types: ["address"],
      componentRestrictions: { country: ["us", "ca"] },
      sessionToken: sessionTokenRef.current,
      ...options,
    };

    const autocomplete = new google.maps.places.Autocomplete(
      inputRef.current,
      autocompleteOptions
    );

    const placeChangedListener = autocomplete.addListener(
      "place_changed",
      () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.formatted_address) {
          console.error("Invalid place selected");
          return;
        }

        onPlaceSelect(place);

        // Create new session token after selection
        sessionTokenRef.current =
          new google.maps.places.AutocompleteSessionToken();
      }
    );

    autocompleteRef.current = autocomplete;

    return () => {
      google.maps.event.removeListener(placeChangedListener);
      autocompleteRef.current = null;
    };
  }, [onPlaceSelect, options]);

  useEffect(() => {
    const cleanup = initializeAutocomplete();
    return () => cleanup?.();
  }, [initializeAutocomplete]);

  return autocompleteRef;
}
