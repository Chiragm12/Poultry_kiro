import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Dashboard store
interface DashboardState {
  selectedDateRange: string
  selectedFarmId: string | null
  selectedShedId: string | null
  refreshInterval: number
  setDateRange: (range: string) => void
  setSelectedFarm: (farmId: string | null) => void
  setSelectedShed: (shedId: string | null) => void
  setRefreshInterval: (interval: number) => void
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    persist(
      (set) => ({
        selectedDateRange: '30d',
        selectedFarmId: null,
        selectedShedId: null,
        refreshInterval: 30000, // 30 seconds
        setDateRange: (range) => set({ selectedDateRange: range }),
        setSelectedFarm: (farmId) => set({ selectedFarmId: farmId }),
        setSelectedShed: (shedId) => set({ selectedShedId: shedId }),
        setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      }),
      {
        name: 'dashboard-storage',
      }
    )
  )
)

// Production form store
interface ProductionFormState {
  selectedShedId: string | null
  selectedDate: Date
  formData: {
    totalEggs: number | null
    brokenEggs: number | null
    damagedEggs: number | null
    notes: string
  }
  setSelectedShed: (shedId: string | null) => void
  setSelectedDate: (date: Date) => void
  updateFormData: (data: Partial<ProductionFormState['formData']>) => void
  resetForm: () => void
}

export const useProductionFormStore = create<ProductionFormState>()(
  devtools((set) => ({
    selectedShedId: null,
    selectedDate: new Date(),
    formData: {
      totalEggs: null,
      brokenEggs: null,
      damagedEggs: null,
      notes: '',
    },
    setSelectedShed: (shedId) => set({ selectedShedId: shedId }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    updateFormData: (data) => 
      set((state) => ({
        formData: { ...state.formData, ...data }
      })),
    resetForm: () => 
      set({
        selectedShedId: null,
        selectedDate: new Date(),
        formData: {
          totalEggs: null,
          brokenEggs: null,
          damagedEggs: null,
          notes: '',
        },
      }),
  }))
)

// Attendance store
interface AttendanceState {
  selectedDate: Date
  selectedWorkers: string[]
  bulkStatus: string | null
  setSelectedDate: (date: Date) => void
  setSelectedWorkers: (workers: string[]) => void
  setBulkStatus: (status: string | null) => void
  toggleWorker: (workerId: string) => void
  clearSelection: () => void
}

export const useAttendanceStore = create<AttendanceState>()(
  devtools((set, get) => ({
    selectedDate: new Date(),
    selectedWorkers: [],
    bulkStatus: null,
    setSelectedDate: (date) => set({ selectedDate: date }),
    setSelectedWorkers: (workers) => set({ selectedWorkers: workers }),
    setBulkStatus: (status) => set({ bulkStatus: status }),
    toggleWorker: (workerId) => {
      const { selectedWorkers } = get()
      const isSelected = selectedWorkers.includes(workerId)
      set({
        selectedWorkers: isSelected
          ? selectedWorkers.filter(id => id !== workerId)
          : [...selectedWorkers, workerId]
      })
    },
    clearSelection: () => set({ selectedWorkers: [], bulkStatus: null }),
  }))
)

// Notification store
interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        notifications: [],
        unreadCount: 0,
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false,
          }
          set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only last 50
            unreadCount: state.unreadCount + 1,
          }))
        },
        markAsRead: (id) => {
          set((state) => ({
            notifications: state.notifications.map(n => 
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }))
        },
        markAllAsRead: () => {
          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0,
          }))
        },
        removeNotification: (id) => {
          const { notifications, unreadCount } = get()
          const notification = notifications.find(n => n.id === id)
          set({
            notifications: notifications.filter(n => n.id !== id),
            unreadCount: notification && !notification.read ? unreadCount - 1 : unreadCount,
          })
        },
        clearAll: () => set({ notifications: [], unreadCount: 0 }),
      }),
      {
        name: 'notification-storage',
      }
    )
  )
)

// Settings store
interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: string
  currency: string
  notifications: {
    email: boolean
    push: boolean
    lowProduction: boolean
    highDamage: boolean
    attendance: boolean
  }
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: string) => void
  setTimezone: (timezone: string) => void
  setDateFormat: (format: string) => void
  setCurrency: (currency: string) => void
  updateNotificationSettings: (settings: Partial<SettingsState['notifications']>) => void
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/dd/yyyy',
        currency: 'USD',
        notifications: {
          email: true,
          push: true,
          lowProduction: true,
          highDamage: true,
          attendance: true,
        },
        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
        setTimezone: (timezone) => set({ timezone }),
        setDateFormat: (format) => set({ dateFormat: format }),
        setCurrency: (currency) => set({ currency }),
        updateNotificationSettings: (settings) =>
          set((state) => ({
            notifications: { ...state.notifications, ...settings }
          })),
      }),
      {
        name: 'settings-storage',
      }
    )
  )
)