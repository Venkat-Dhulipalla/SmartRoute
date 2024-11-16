"use client";

import { useState } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { AddressInput } from "@/components/AddressInput";

interface Passenger {
  pickup: string;
  dropoff: string;
  priority: number;
}

interface FormData {
  currentLocation: string;
  passengers: Passenger[];
}

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = [
  "places",
];

export default function RouteGeneratorForm() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const [formData, setFormData] = useState<FormData>({
    currentLocation: "",
    passengers: [{ pickup: "", dropoff: "", priority: 1 }],
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

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
      setErrors({
        currentLocation: "Failed to generate route. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPassenger = () => {
    setFormData((prev) => ({
      ...prev,
      passengers: [
        ...prev.passengers,
        { pickup: "", dropoff: "", priority: 1 },
      ],
    }));
  };

  const handleRemovePassenger = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      passengers: prev.passengers.filter((_, i) => i !== index),
    }));
  };

  const handleAddressChange =
    (type: "currentLocation" | "pickup" | "dropoff", index?: number) =>
    (value: string) => {
      if (type === "currentLocation") {
        setFormData((prev) => ({
          ...prev,
          currentLocation: value,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          passengers: prev.passengers.map((p, i) =>
            i === index ? { ...p, [type]: value } : p
          ),
        }));
      }
    };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <AddressInput
            id="currentLocation"
            label="Current Location"
            value={formData.currentLocation}
            onChange={handleAddressChange("currentLocation")}
            error={errors.currentLocation}
            placeholder="Enter your starting point"
          />

          {formData.passengers.map((passenger, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Passenger {index + 1}</h3>
                {formData.passengers.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemovePassenger(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <AddressInput
                id={`pickup-${index}`}
                label="Pickup Location"
                value={passenger.pickup}
                onChange={handleAddressChange("pickup", index)}
                error={errors.passengers?.[index]?.pickup}
                placeholder="Enter pickup address"
              />

              <AddressInput
                id={`dropoff-${index}`}
                label="Drop-off Location"
                value={passenger.dropoff}
                onChange={handleAddressChange("dropoff", index)}
                error={errors.passengers?.[index]?.dropoff}
                placeholder="Enter drop-off address"
              />
            </div>
          ))}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPassenger}
              disabled={isSubmitting}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Passenger
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Optimizing..." : "Generate Route"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
