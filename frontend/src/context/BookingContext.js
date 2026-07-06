"use client";

import React, { createContext, useContext, useState } from "react";

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const openBooking = (packageName = null) => {
    setSelectedPackage(packageName);
    setIsBookingOpen(true);
  };

  const closeBooking = () => {
    setIsBookingOpen(false);
    setSelectedPackage(null);
  };

  return (
    <BookingContext.Provider
      value={{
        isBookingOpen,
        selectedPackage,
        openBooking,
        closeBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
