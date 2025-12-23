"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createFarmSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface CreateFarmFormProps {
  onSuccess: () => void
}

interface Manager {
  id: string
  name: string
  email: string
}

type CreateFarmFormData = {
  name: string
  location?: string
  description?: string
  managerId?: string
}

export default function CreateFarmForm({ onSuccess }: CreateFarmFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [managers, setManagers] = useState<Manager[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateFarmFormData>({
    resolver: zodResolver(createFarmSchema),
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

  const onSubmit = async (data: CreateFarmFormData) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/farms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create farm")
      }

      onSuccess()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create farm")
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
        <Select onValueChange={(value) => setValue("managerId", value)} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select a manager (optional)" />
          </SelectTrigger>
          <SelectContent>
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

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Farm
        </Button>
      </div>
    </form>
  )
}