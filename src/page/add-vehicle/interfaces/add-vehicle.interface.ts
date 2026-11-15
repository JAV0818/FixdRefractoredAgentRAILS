// Add-vehicle form schema (react-hook-form + Zod). All fields are required.

import { z } from "zod";

import { ADD_VEHICLE_COPY } from "../add-vehicle.constants";

const MIN_YEAR = 1900;

export const addVehicleSchema = z.object({
  make: z.string().trim().min(1, ADD_VEHICLE_COPY.errorMake),
  model: z.string().trim().min(1, ADD_VEHICLE_COPY.errorModel),
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, ADD_VEHICLE_COPY.errorYear)
    .refine((y) => Number(y) >= MIN_YEAR && Number(y) <= new Date().getFullYear() + 1, ADD_VEHICLE_COPY.errorYear),
  color: z.string().trim().min(1, ADD_VEHICLE_COPY.errorColor),
  licensePlate: z.string().trim().min(1, ADD_VEHICLE_COPY.errorPlate),
});

export type AddVehicleForm = z.infer<typeof addVehicleSchema>;
