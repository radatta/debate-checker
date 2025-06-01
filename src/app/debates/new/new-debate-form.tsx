"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const speakerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  speakers: z.array(speakerSchema).min(2, "At least two speakers are required"),
});

type FormData = z.infer<typeof formSchema>;

export function NewDebateForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_time: getCurrentDateTime(),
      speakers: [{ name: "", role: "" }],
    },
  });

  const speakers = watch("speakers");

  const addSpeaker = () => {
    setValue("speakers", [...speakers, { name: "", role: "" }]);
  };

  const removeSpeaker = (index: number) => {
    setValue(
      "speakers",
      speakers.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Convert datetime-local format to full ISO string
      const formatDateTime = (dateTimeStr: string | undefined) => {
        if (!dateTimeStr) return new Date().toISOString();
        // If it's from datetime-local input, it's missing timezone info
        // Add ":00Z" to make it a valid ISO string (assuming UTC)
        if (dateTimeStr.length === 16) {
          return `${dateTimeStr}:00.000Z`;
        }
        return new Date(dateTimeStr).toISOString();
      };

      const submitData = {
        ...data,
        start_time: formatDateTime(data.start_time),
        end_time: data.end_time ? formatDateTime(data.end_time) : undefined,
      };

      const response = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error("Failed to create debate");
      }

      const debate = await response.json();
      router.push(`/debates/${debate.id}`);
    } catch (error) {
      console.error("Error creating debate:", error);
      alert("Failed to create debate. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          {...register("title")}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter debate title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          {...register("description")}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter debate description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Start Time (defaults to now)
          </label>
          <input
            {...register("start_time")}
            type="datetime-local"
            className="w-full px-3 py-2 border rounded-md"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave blank to start immediately
          </p>
          {errors.start_time && (
            <p className="mt-1 text-sm text-red-500">
              {errors.start_time.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            End Time (Optional)
          </label>
          <input
            {...register("end_time")}
            type="datetime-local"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Speakers</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSpeaker}
          >
            Add Speaker
          </Button>
        </div>

        {speakers.map((_, index) => (
          <div key={index} className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                {...register(`speakers.${index}.name`)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Speaker name"
              />
              {errors.speakers?.[index]?.name && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.speakers[index]?.name?.message}
                </p>
              )}
            </div>
            <div className="flex-1">
              <input
                {...register(`speakers.${index}.role`)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Role (optional)"
              />
            </div>
            {speakers.length > 1 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeSpeaker(index)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        {errors.speakers && !Array.isArray(errors.speakers) && (
          <p className="mt-1 text-sm text-red-500">{errors.speakers.message}</p>
        )}
        {speakers.length < 2 && (
          <p className="mt-1 text-sm text-red-500">
            Please add at least two speakers.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Debate"}
        </Button>
      </div>
    </form>
  );
}
