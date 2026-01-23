import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateContextType {
  currentDate: string | null; // YYYY-MM-DD格式
  setCurrentDate: (date: string | null) => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: ReactNode }) {
  const [currentDate, setCurrentDate] = useState<string | null>(null);

  return (
    <DateContext.Provider value={{ currentDate, setCurrentDate }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDateContext() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDateContext must be used within a DateProvider');
  }
  return context;
}

