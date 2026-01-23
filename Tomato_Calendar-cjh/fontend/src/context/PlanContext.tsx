import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { eventsAPI } from '../services/api';

export interface Plan {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  startDate: string; // YYYY-MM-DD格式
  endDate: string; // YYYY-MM-DD格式
  location?: string;
  color: string;
  allDay: boolean;
  repeat: string;
  notes: string;
}

interface PlanContextType {
  plans: Plan[];
  addPlan: (plan: Plan) => Promise<Plan | null>;
  updatePlan: (id: string, plan: Plan) => Promise<Plan | null>;
  deletePlan: (id: string) => Promise<void>;
  fetchPlansInRange: (startDate: string, endDate: string) => Promise<Plan[]>;
  fetchPlanById: (id: string) => Promise<Plan | null>;
  getPlansForDate: (date: string) => Plan[]; // date格式：YYYY-MM-DD
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const pad2 = (value: number) => String(value).padStart(2, '0');

const toLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
};

const toTimeDisplay = (date: Date) => {
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${hours} : ${minutes}`;
};

const normalizeRepeat = (repeat?: string) => {
  if (!repeat) return 'Never';
  const value = repeat.toLowerCase();
  const allowed = ['never', 'daily', 'weekly', 'monthly', 'yearly'];
  if (allowed.includes(value)) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return 'Never';
};

const mapEventToPlan = (event: any): Plan => {
  const startDateObj = new Date(event.startTime);
  const endDateObj = new Date(event.endTime);
  return {
    id: String(event.id),
    title: event.title,
    startTime: toTimeDisplay(startDateObj),
    endTime: toTimeDisplay(endDateObj),
    startDate: toLocalDateString(startDateObj),
    endDate: toLocalDateString(endDateObj),
    location: event.location || undefined,
    color: event.color || '#DF8788',
    allDay: Boolean(event.isAllDay),
    repeat: normalizeRepeat(event.repeat),
    notes: event.notes || '',
  };
};

const toApiRepeat = (repeat: string) => {
  const value = repeat?.toLowerCase?.() ?? 'never';
  const allowed = ['never', 'daily', 'weekly', 'monthly', 'yearly'];
  return allowed.includes(value) ? value : 'never';
};

const toIsoString = (date: string, time: string) => {
  const cleaned = time.replace(/\s+/g, '');
  const [hours, minutes] = cleaned.split(':');
  const safeHours = hours?.padStart(2, '0') ?? '00';
  const safeMinutes = minutes?.padStart(2, '0') ?? '00';
  const localDate = new Date(`${date}T${safeHours}:${safeMinutes}:00`);
  return localDate.toISOString();
};

const mapPlanToPayload = (plan: Plan) => ({
  title: plan.title,
  startTime: toIsoString(plan.startDate, plan.startTime),
  endTime: toIsoString(plan.endDate, plan.endTime),
  isAllDay: plan.allDay,
  location: plan.location,
  color: plan.color,
  repeat: toApiRepeat(plan.repeat),
  notes: plan.notes,
});

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const addPlan = useCallback(async (plan: Plan) => {
    try {
      const created = await eventsAPI.createEvent(mapPlanToPayload(plan));
      const mapped = mapEventToPlan(created);
      setPlans((prev) => [...prev, mapped]);
      return mapped;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to create plan', error);
      }
      return null;
    }
  }, []);

  const updatePlan = useCallback(async (id: string, updatedPlan: Plan) => {
    try {
      const updated = await eventsAPI.updateEvent(id, mapPlanToPayload(updatedPlan));
      const mapped = updated?.id ? mapEventToPlan(updated) : { ...updatedPlan, id };
      setPlans((prev) => {
        const exists = prev.some((plan) => plan.id === mapped.id);
        if (exists) {
          return prev.map((plan) => (plan.id === mapped.id ? mapped : plan));
        }
        return [...prev, mapped];
      });
      return mapped;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to update plan', error);
      }
      return null;
    }
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await eventsAPI.deleteEvent(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to delete plan', error);
      }
    }
  }, []);

  const fetchPlansInRange = useCallback(async (startDate: string, endDate: string) => {
    try {
      const events = await eventsAPI.getEvents(startDate, endDate);
      const mapped = (events || []).map(mapEventToPlan);
      setPlans((prev) => {
        const isSingleDay = startDate === endDate;
        if (mapped.length === 0 && isSingleDay) {
          const hasLocalInRange = prev.some(
            (plan) => plan.startDate <= endDate && plan.endDate >= startDate
          );
          if (hasLocalInRange) {
            return prev;
          }
        }
        const filtered = prev.filter(
          (plan) => plan.startDate > endDate || plan.endDate < startDate
        );
        return [...filtered, ...mapped];
      });
      return mapped;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch plans', error);
      }
      return [];
    }
  }, []);

  const fetchPlanById = useCallback(async (id: string) => {
    try {
      const event = await eventsAPI.getEvent(id);
      if (!event) return null;
      const mapped = mapEventToPlan(event);
      setPlans((prev) => {
        const exists = prev.some((p) => p.id === mapped.id);
        if (exists) {
          return prev.map((p) => (p.id === mapped.id ? mapped : p));
        }
        return [...prev, mapped];
      });
      return mapped;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch plan by id', error);
      }
      return null;
    }
  }, []);

  const getPlansForDate = useCallback((date: string): Plan[] => {
    // 返回在指定日期范围内的所有计划
    return plans.filter((plan) => {
      // 如果计划的开始日期或结束日期包含这个日期，就显示
      return plan.startDate <= date && plan.endDate >= date;
    });
  }, [plans]);

  const value = useMemo(
    () => ({
      plans,
      addPlan,
      updatePlan,
      deletePlan,
      fetchPlansInRange,
      fetchPlanById,
      getPlansForDate,
    }),
    [plans, addPlan, updatePlan, deletePlan, fetchPlansInRange, fetchPlanById, getPlansForDate]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
