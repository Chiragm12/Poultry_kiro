"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { updateFarmSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface EditFarmFormProps {
  farm: {
    id: string
    name: string
    location?: string
    description?: string
    isActive: boolean
    maleCount?: number
    femaleCount?: number
    manager?: {
      id: string
      name: string
      email: string
    }
  }
  onSuccess: () => void
}

interface Manager {
  id: string
  name: string
  email: string
}

type EditFarmFormData = {
  name?: string
  location?: string
  description?: string
  managerId?: string
  isActive?: boolean
  maleCount?: number
  femaleCount?: number
}

export default function EditFarmForm({ farm, onSuccess }: EditFarmFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [managers, setManagers] = useState<Manager[]>([])
  const [isActive, setIsActive] = useState(farm.isActive)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditFarmFormData>({
    resolver: zodResolver(updateFarmSchema),
    defaultValues: {
      name: farm.name,
      location: farm.location || "",
      description: farm.description || "",
      managerId: farm.manager?.id || "",
      isActive: farm.isActive,
      maleCount: farm.maleCount || 0,
      femaleCount: farm.femaleCount || 0,
    },
  })

  useEffect(() => {
    fetchManagers()
  }, [])

  const fetchManagers = async () => {
    try {
      const response = await fetch("/api/users?role=MANAGER,OWNER")
      const result = await response.json()

      if (response.ok) {
        setManagers(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching managers:", error)
    }
  }

  const onSubmit = async (data: EditFarmFormData) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/farms/${farm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          isActive,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update farm")
      }

      onSuccess()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update farm")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Farm Name *</Label>
        <Input
          id="name"
          placeholder="Enter farm name"
          {...register("name")}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="Enter farm location"
          {...register("location")}
          disabled={isLoading}
        />
        {errors.location && (
          <p className="text-sm text-red-600">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter farm description"
          {...register("description")}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="managerId">Manager</Label>
        <Select 
          onValueChange={(value) => setValue("managerId", value)} 
          disabled={isLoading}
          defaultValue={farm.manager?.id || ""}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a manager (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No manager</SelectItem>
            {managers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                {manager.name} ({manager.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.managerId && (
          <p className="text-sm text-red-600">{errors.managerId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maleCount">Male Birds</Label>
          <Input
            id="maleCount"
            type="number"
            min="0"
            placeholder="0"
            {...register("maleCount", { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.maleCount && (
            <p className="text-sm text-red-600">{errors.maleCount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="femaleCount">Female Birds</Label>
          <Input
            id="femaleCount"
            type="number"
            min="0"
            placeholder="0"
            {...register("femaleCount", { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.femaleCount && (
            <p className="text-sm text-red-600">{errors.femaleCount.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={isLoading}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Farm
        </Button>
      </div>
    </form>
  )
}