import { z } from "zod"

// Define the role and status values as constants since we converted enums to strings
const USER_ROLES = ["OWNER", "MANAGER", "WORKER"] as const
const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "SICK_LEAVE", "VACATION"] as const

// Auth schemas
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
})

export const passwordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const newPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// User management schemas
export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(USER_ROLES),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  // Additional fields for workers and managers
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar number must be 12 digits").optional().or(z.literal("")),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar number must be 12 digits").optional().or(z.literal("")),
})

// Farm management schemas
export const createFarmSchema = z.object({
  name: z.string().min(2, "Farm name must be at least 2 characters"),
  location: z.string().optional(),
  description: z.string().optional(),
  managerId: z.string().optional(),
  maleCount: z.number().min(0, "Male count cannot be negative").default(0),
  femaleCount: z.number().min(0, "Female count cannot be negative").default(0),
})

export const updateFarmSchema = z.object({
  name: z.string().min(2, "Farm name must be at least 2 characters").optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  managerId: z.string().optional(),
  isActive: z.boolean().optional(),
  maleCount: z.number().min(0, "Male count cannot be negative").optional(),
  femaleCount: z.number().min(0, "Female count cannot be negative").optional(),
})

// Shed management schemas
export const createShedSchema = z.object({
  name: z.string().min(2, "Shed name must be at least 2 characters"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  description: z.string().optional(),
  farmId: z.string().min(1, "Farm is required"),
})

export const updateShedSchema = z.object({
  name: z.string().min(2, "Shed name must be at least 2 characters").optional(),
  capacity: z.number().min(1, "Capacity must be at least 1").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

// Production schemas
export const createProductionSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  totalEggs: z.number().min(0, "Total eggs cannot be negative"),
  normalEggs: z.number().min(0, "Normal eggs cannot be negative").default(0),
  commEggs: z.number().min(0, "Commercial eggs cannot be negative").default(0),
  waterEggs: z.number().min(0, "Water eggs cannot be negative").default(0),
  jellyEggs: z.number().min(0, "Jelly eggs cannot be negative").default(0),
  creakEggs: z.number().min(0, "Creak eggs cannot be negative").default(0),
  leakerEggs: z.number().min(0, "Leaker eggs cannot be negative").default(0),
  // Keep old fields for backward compatibility
  jumboEggs: z.number().min(0, "Jumbo eggs cannot be negative").default(0).optional(),
  crackedEggs: z.number().min(0, "Cracked eggs cannot be negative").default(0).optional(),
  brokenEggs: z.number().min(0, "Broken eggs cannot be negative").default(0).optional(),
  damagedEggs: z.number().min(0, "Damaged eggs cannot be negative").default(0).optional(),
  notes: z.string().optional(),
  shedId: z.string().min(1, "Shed is required"),
}).refine((data) => {
  const total = data.totalEggs
  const normal = data.normalEggs || 0
  const comm = data.commEggs || 0
  const water = data.waterEggs || 0
  const jelly = data.jellyEggs || 0
  const creak = data.creakEggs || 0
  const leaker = data.leakerEggs || 0
  const categorizedTotal = normal + comm + water + jelly + creak + leaker
  return categorizedTotal <= total
}, {
  message: "Total categorized eggs cannot exceed total eggs",
  path: ["totalEggs"],
})

export const updateProductionSchema = z.object({
  totalEggs: z.number().min(0, "Total eggs cannot be negative").optional(),
  normalEggs: z.number().min(0, "Normal eggs cannot be negative").optional(),
  commEggs: z.number().min(0, "Commercial eggs cannot be negative").optional(),
  waterEggs: z.number().min(0, "Water eggs cannot be negative").optional(),
  jellyEggs: z.number().min(0, "Jelly eggs cannot be negative").optional(),
  creakEggs: z.number().min(0, "Creak eggs cannot be negative").optional(),
  leakerEggs: z.number().min(0, "Leaker eggs cannot be negative").optional(),
  // Keep old fields for backward compatibility
  jumboEggs: z.number().min(0, "Jumbo eggs cannot be negative").optional(),
  crackedEggs: z.number().min(0, "Cracked eggs cannot be negative").optional(),
  brokenEggs: z.number().min(0, "Broken eggs cannot be negative").optional(),
  damagedEggs: z.number().min(0, "Damaged eggs cannot be negative").optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.totalEggs !== undefined) {
    const normal = data.normalEggs || 0
    const comm = data.commEggs || 0
    const water = data.waterEggs || 0
    const jelly = data.jellyEggs || 0
    const creak = data.creakEggs || 0
    const leaker = data.leakerEggs || 0
    const categorizedTotal = normal + comm + water + jelly + creak + leaker
    return categorizedTotal <= data.totalEggs
  }
  return true
}, {
  message: "Total categorized eggs cannot exceed total eggs",
  path: ["totalEggs"],
})

// Attendance schemas
export const createAttendanceSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  status: z.enum(ATTENDANCE_STATUSES),
  notes: z.string().optional(),
  userId: z.string().min(1, "User is required"),
})

export const bulkAttendanceSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  attendanceRecords: z.array(z.object({
    userId: z.string().min(1, "User is required"),
    status: z.enum(ATTENDANCE_STATUSES),
    notes: z.string().optional(),
  })).min(1, "At least one attendance record is required"),
})

export const updateAttendanceSchema = z.object({
  status: z.enum(ATTENDANCE_STATUSES).optional(),
  notes: z.string().optional(),
})

// Report schemas
export const reportFilterSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  farmId: z.string().optional(),
  shedId: z.string().optional(),
  managerId: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}, {
  message: "Start date must be before or equal to end date",
  path: ["endDate"],
})

// Dashboard filter schemas
export const dashboardFilterSchema = z.object({
  dateRange: z.enum(["7d", "30d", "90d", "1y", "custom"]).default("30d"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  farmId: z.string().optional(),
  shedId: z.string().optional(),
  managerId: z.string().optional(),
}).refine((data) => {
  if (data.dateRange === "custom") {
    return data.startDate && data.endDate
  }
  return true
}, {
  message: "Start date and end date are required for custom date range",
  path: ["startDate"],
})