"use client";

import { useState, useEffect, useRef } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

interface Passenger {
  pickup: string;
  dropoff: string;
  priority: number;
}

interface FormData {
  currentLocation: string;
  passengers: Passenger[];
}
const libraries = ["places"];
export default function RouteGeneratorForm() {
  const [formData, setFormData] = useState<FormData>({
    currentLocation: "",
    passengers: [{ pickup: "", dropoff: "", priority: 1 }],
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libraries as any,
  });

  const autocompleteRefs = useRef<{
    [key: string]: google.maps.places.Autocomplete | null;
  }>({});

  useEffect(() => {
    if (isLoaded) {
      initializeAutocomplete("currentLocation");
      formData.passengers.forEach((_, index) => {
        initializeAutocomplete(`pickup-${index}`);
        initializeAutocomplete(`dropoff-${index}`);
      });
    }
  }, [isLoaded, formData.passengers.length]);

  const initializeAutocomplete = (id: string) => {
    if (!document.getElementById(id)) return;

    const autocomplete = new google.maps.places.Autocomplete(
      document.getElementById(id) as HTMLInputElement,
      { types: ["geocode"] }
    );
    autocompleteRefs.current[id] = autocomplete;

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        if (id === "currentLocation") {
          setFormData((prev) => ({
            ...prev,
            currentLocation: place.formatted_address!,
          }));
        } else {
          const [type, index] = id.split("-");
          setFormData((prev) => ({
            ...prev,
            passengers: prev.passengers.map((p, i) =>
              i === parseInt(index)
                ? { ...p, [type]: place.formatted_address! }
                : p
            ),
          }));
        }
      }
    });
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.currentLocation) {
      newErrors.currentLocation = "Current location is required";
    }
    formData.passengers.forEach((passenger, index) => {
      if (!passenger.pickup) {
        newErrors.passengers = newErrors.passengers || [];
        newErrors.passengers[index] = newErrors.passengers[index] || {};
        newErrors.passengers[index].pickup = "Pickup location is required";
      }
      if (!passenger.dropoff) {
        newErrors.passengers = newErrors.passengers || [];
        newErrors.passengers[index] = newErrors.passengers[index] || {};
        newErrors.passengers[index].dropoff = "Drop-off location is required";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/optimize-route", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error("Failed to optimize route");
        }
        const result = await response.json();
        window.location.href = `/results?routeData=${encodeURIComponent(
          JSON.stringify(result)
        )}`;
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index?: number
  ) => {
    const { name, value } = e.target;
    if (index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        passengers: prev.passengers.map((p, i) =>
          i === index ? { ...p, [name]: value } : p
        ),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePriorityChange = (value: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      passengers: prev.passengers.map((p, i) =>
        i === index ? { ...p, priority: parseInt(value) } : p
      ),
    }));
  };

  const addPassenger = () => {
    setFormData((prev) => ({
      ...prev,
      passengers: [
        ...prev.passengers,
        { pickup: "", dropoff: "", priority: 1 },
      ],
    }));
  };

  const removePassenger = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      passengers: prev.passengers.filter((_, i) => i !== index),
    }));
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Route Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="currentLocation"
                className="block text-sm font-medium text-gray-700"
              >
                Current Location
              </label>
              <Input
                id="currentLocation"
                name="currentLocation"
                type="text"
                onChange={handleInputChange}
                value={formData.currentLocation}
                className={errors.currentLocation ? "border-red-500" : ""}
              />
              {errors.currentLocation && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.currentLocation}
                </p>
              )}
            </div>

            {formData.passengers.map((passenger, index) => (
              <Card key={index} className="mb-4">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`pickup-${index}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Pickup Location
                      </label>
                      <Input
                        id={`pickup-${index}`}
                        name="pickup"
                        type="text"
                        onChange={(e) => handleInputChange(e, index)}
                        value={passenger.pickup}
                        className={
                          errors.passengers?.[index]?.pickup
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {errors.passengers?.[index]?.pickup && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.passengers[index].pickup}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor={`dropoff-${index}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Drop-off Location
                      </label>
                      <Input
                        id={`dropoff-${index}`}
                        name="dropoff"
                        type="text"
                        onChange={(e) => handleInputChange(e, index)}
                        value={passenger.dropoff}
                        className={
                          errors.passengers?.[index]?.dropoff
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {errors.passengers?.[index]?.dropoff && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.passengers[index].dropoff}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label
                      htmlFor={`priority-${index}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Priority
                    </label>
                    <Select
                      onValueChange={(value) =>
                        handlePriorityChange(value, index)
                      }
                      defaultValue={passenger.priority.toString()}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((priority) => (
                          <SelectItem
                            key={priority}
                            value={priority.toString()}
                          >
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="mt-4"
                      onClick={() => removePassenger(index)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Passenger
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={addPassenger}>
              <Plus className="mr-2 h-4 w-4" />
              Add Passenger
            </Button>
          </div>
        </CardContent>
      </Card>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Generating Route..." : "Generate Route"}
      </Button>
    </form>
  );
}
