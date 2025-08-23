import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonText,
  IonContent,
  IonHeader,
  IonToolbar,
  IonPage,
  IonFooter,
} from "@ionic/react";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

  gsap.registerPlugin(ScrollTrigger);

interface MonthData {
  id: string;
  name: string;
  year: number;
  monthIndex: number;
  days: number[];
  startDay: number; // 0 = Sunday, 1 = Monday, etc.
}

import { useLocation } from "react-router-dom";
import { useIonRouter } from "@ionic/react";

interface CustomYearCalendarProps {
  startDate?: Date;
  selectedDates?: { checkIn: Date | null; checkOut: Date | null };
}

interface CalendarLocationState {
  selectedDates?: { checkIn: Date | null; checkOut: Date | null };
  onDatesSelect?: (dates: { checkIn: Date | null; checkOut: Date | null }) => void;
}

// Move these outside the component to prevent recreation on every render
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const dayNames = ["M", "T", "W", "T", "F", "S", "S"];

// Helper function to get initial date from localStorage
const getInitialDate = (key: string, fallback: Date | null): Date | null => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Date(stored) : fallback;
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
};

// Helper function to safely set localStorage
const setDateInStorage = (key: string, date: Date | null) => {
  try {
    if (date) {
      localStorage.setItem(key, date.toISOString());
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn(`Error setting ${key} in localStorage:`, error);
  }
};

const CustomYearCalendar: React.FC<CustomYearCalendarProps> = ({
  startDate = new Date(),
  selectedDates = { checkIn: null, checkOut: null },
}) => {
  console.log("CustomYearCalendar component is rendering");
  
  const contentRef = useRef<HTMLIonContentElement>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | undefined>(undefined);

  useEffect(() => {
    const getIonScrollElement = async () => {
      if (contentRef.current) {
        const el = await contentRef.current.getScrollElement();
        setScrollElement(el);
      }
    };
    getIonScrollElement();
  }, []);

  const location = useLocation();
  // Correctly destructure the nested state object
  const { onDatesSelect: onDatesSelectFromState, selectedDates: selectedDatesFromState } =
    (location.state as { state?: CalendarLocationState })?.state || {};

  // Memoize static values to prevent recalculation
    const { today, maxDate } = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const currentYear = todayDate.getFullYear();
    const maxAllowedDate = new Date(currentYear + 1, 2, 31); // March 31st of next year
    
    return {
      today: todayDate,
      maxDate: maxAllowedDate
    };
  }, []);

  const [currentYear] = useState<number>(() => startDate.getFullYear());

  // Optimize initial state calculation
  const [checkInDate, setCheckInDate] = useState<Date | null>(() => {
    const { checkIn: checkInFromState } = selectedDatesFromState || {};
    const { checkIn: checkInFromProps } = selectedDates || {};
    
    return checkInFromState || getInitialDate('checkInDate', checkInFromProps);
  });

  const [checkOutDate, setCheckOutDate] = useState<Date | null>(() => {
    const { checkOut: checkOutFromState } = selectedDatesFromState || {};
    const { checkOut: checkOutFromProps } = selectedDates || {};
    
    return checkOutFromState || getInitialDate('checkOutDate', checkOutFromProps);
  });

  // Memoize the generateYearMonths function
  const generateYearMonths = useCallback((year: number): MonthData[] => {
    const yearMonths: MonthData[] = [];

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const adjustedStartDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      yearMonths.push({
        id: `${year}-${month}`,
        name: monthNames[month],
        year: year,
        monthIndex: month,
        days: days,
        startDay: adjustedStartDay,
      });
    }
    return yearMonths;
  }, []);

  // Memoize months calculation
  const months = useMemo(() => {
    return generateYearMonths(currentYear);
  }, [currentYear, generateYearMonths]);

  // Optimize localStorage updates with useEffect that only runs when dates actually change
  useEffect(() => {
    setDateInStorage('checkInDate', checkInDate);
  }, [checkInDate]);

  useEffect(() => {
    setDateInStorage('checkOutDate', checkOutDate);
  }, [checkOutDate]);


  // Memoize the date range checking function
  const isDateInRange = useCallback((month: MonthData, day: number): string => {
    const currentDate = new Date(month.year, month.monthIndex, day);
    currentDate.setHours(0, 0, 0, 0);

    if (!checkInDate) {
      return "none";
    }

    if (checkInDate && checkOutDate) {
      if (currentDate >= checkInDate && currentDate <= checkOutDate) {
        if (currentDate.getTime() === checkInDate.getTime()) return "start";
        if (currentDate.getTime() === checkOutDate.getTime()) return "end";
        return "in-range";
      }
    } else if (checkInDate && currentDate.getTime() === checkInDate.getTime()) {
      return "start";
    }
    return "none";
  }, [checkInDate, checkOutDate]);

  const handleDateClick = useCallback((month: MonthData, day: number) => {
    const clickedDate = new Date(month.year, month.monthIndex, day);
    clickedDate.setHours(0, 0, 0, 0);

    if (clickedDate < today || clickedDate > maxDate) {
      return;
    }

    const currentRangeStatus = isDateInRange(month, day);

    if (currentRangeStatus !== "none") {
      setCheckInDate(null);
      setCheckOutDate(null);
      // Call onDatesSelectFromState to clear the selection
      if (onDatesSelectFromState) {
        onDatesSelectFromState({ checkIn: null, checkOut: null });
      }
    } else if (!checkInDate) {
      setCheckInDate(clickedDate);
      setCheckOutDate(null);
    } else {
      if (clickedDate < checkInDate) {
        setCheckOutDate(checkInDate);
        setCheckInDate(clickedDate);
        if (onDatesSelectFromState) {
          onDatesSelectFromState({ checkIn: clickedDate, checkOut: checkInDate });
        }
      } else {
        setCheckOutDate(clickedDate);
        if (onDatesSelectFromState) {
          onDatesSelectFromState({ checkIn: checkInDate, checkOut: clickedDate });
        }
      }
    }
  }, [checkInDate, today, maxDate, isDateInRange, onDatesSelectFromState]);

  // Memoize the month rendering function
  const renderMonth = useCallback((month: MonthData) => {
    const allCells: React.ReactNode[] = [];

    for (let i = 0; i < month.startDay; i++) {
      allCells.push(
        <IonCol
          key={`empty-start-${month.id}-${i}`}
          className="calendar-day-col"
        >
          <div className="calendar-day-empty"></div>
        </IonCol>
      );
    }

    month.days.forEach((dayNumber) => {
      const currentDate = new Date(month.year, month.monthIndex, dayNumber);
      currentDate.setHours(0, 0, 0, 0);
      const isPast = currentDate < today;
      const isTooFar = currentDate > maxDate;
      const rangeStatus = isDateInRange(month, dayNumber);
      const isSelected = rangeStatus !== "none";
      const isStart = rangeStatus === "start";
      const isEnd = rangeStatus === "end";
      const isInRange = rangeStatus === "in-range";

      allCells.push(
        <IonCol
          key={`day-${month.id}-${dayNumber}`}
          className={`calendar-day-col ${isSelected ? `day-${rangeStatus}` : ""}`}
          data-date={`${month.year}-${month.monthIndex}-${dayNumber}`}
        >
          <IonButton
            fill={isStart || isEnd ? "solid" : "clear"}
            color={isStart || isEnd ? "primary" : "dark"}
            className={`calendar-day-button ${isInRange ? "in-range-button" : ""} ${isPast ? "past-date" : ""}`}
            onClick={() => handleDateClick(month, dayNumber)}
            disabled={isPast || isTooFar}
            aria-label={`Select ${month.name} ${dayNumber}`}
            style={{ '--color': isStart || isEnd ? 'white' : '#1A1A1A' }}
          >
            {dayNumber}
          </IonButton>
        </IonCol>
      );
    });

    const remainingCellsInLastWeek = (7 - (allCells.length % 7)) % 7;
    for (let i = 0; i < remainingCellsInLastWeek; i++) {
      allCells.push(
        <IonCol
          key={`empty-end-${month.id}-${i}`}
          className="calendar-day-col"
        >
          <div className="calendar-day-empty"></div>
        </IonCol>
      );
    }

    const weeks: React.ReactNode[] = [];
    for (let i = 0; i < allCells.length; i += 7) {
      weeks.push(
        <IonRow key={`week-${month.id}-${i}`} className="calendar-week-row">
          {allCells.slice(i, i + 7)}
        </IonRow>
      );
    }

    return weeks;
  }, [today, maxDate, isDateInRange, handleDateClick]);

  // Memoize filtered months
  const visibleMonths = useMemo(() => {
    return months.filter((month) => {
      const monthStart = new Date(month.year, month.monthIndex, 1);
      monthStart.setHours(0, 0, 0, 0);
      return monthStart.getMonth() >= today.getMonth() || monthStart.getFullYear() > today.getFullYear();
    });
  }, [months, today]);

  // GSAP Animation Effect
  useEffect(() => {
    const animateDateSelection = () => {
      // Reset all date styles to ensure clean state before animating
      gsap.set(document.querySelectorAll('.calendar-day-col .calendar-day-button'), {
        '--background': 'var(--ion-color-dark)',
        '--color': 'var(--ion-color-dark)',
        '--border-radius': '50%',
        scale: 1,
        opacity: 1,
      });
      gsap.set(document.querySelectorAll('.calendar-day-col'), {
        background: 'transparent',
        scaleX: 1,
        transformOrigin: 'left center',
      });

      if (checkInDate) {
        const checkInElement = document.querySelector(
          `.calendar-day-col[data-date="${checkInDate.getFullYear()}-${checkInDate.getMonth()}-${checkInDate.getDate()}"] .calendar-day-button`
        );

        if (checkInElement) {
          gsap.fromTo(
            checkInElement,
            { scale: 0.8, opacity: 0.5 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.3,
              ease: 'back.out(1.7)',
              overwrite: 'auto',
              '--background': 'var(--ion-color-primary)',
              '--color': 'var(--ion-color-primary-contrast)',
              '--border-radius': '50%', // Ensure it's round if only check-in
            }
          );
        }

        if (checkOutDate) {
          const checkOutElement = document.querySelector(
            `.calendar-day-col[data-date="${checkOutDate.getFullYear()}-${checkOutDate.getMonth()}-${checkOutDate.getDate()}"] .calendar-day-button`
          );

          // Animate check-in button to be rounded
          if (checkInElement) {
            gsap.to(checkInElement, {
              scale: 1, // Ensure it's fully visible and scaled
              opacity: 1,
              duration: 0.3,
              ease: 'back.out(1.7)',
              overwrite: 'auto',
              '--background': 'var(--ion-color-primary)',
              '--color': 'var(--ion-color-primary-contrast)',
              '--border-radius': '50%', // Ensure it's round if only check-in
            });
          }

          // Animate check-out button to be rounded
          if (checkOutElement) {
            gsap.fromTo(
              checkOutElement,
              { scale: 0.8, opacity: 0.5 },
              {
                scale: 1,
                opacity: 1,
                duration: 0.3,
                ease: 'back.out(1.7)',
                overwrite: 'auto',
                '--background': 'var(--ion-color-primary)',
                '--color': 'var(--ion-color-primary-contrast)',
                '--border-radius': '50%', // Make it rounded
              }
            );
          }

          // Animate in-range dates with rounded borders
          const tempDate = new Date(checkInDate);
          while (tempDate <= checkOutDate) {
            const inRangeCol = document.querySelector(
              `.calendar-day-col[data-date="${tempDate.getFullYear()}-${tempDate.getMonth()}-${tempDate.getDate()}"]`
            );
            if (inRangeCol) {
              const inRangeButton = inRangeCol.querySelector('.calendar-day-button');
              if (inRangeButton) {
                gsap.fromTo(
                  inRangeButton,
                  { scale: 0.8, opacity: 0.5, '--border-radius': '50%' }, // Apply rounded border
                  {
                    scale: 1,
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                    overwrite: 'auto',
                    '--background': 'var(--ion-color-primary)', // Apply background to button
                    '--color': 'var(--ion-color-primary-contrast)',
                  }
                );
              }
            }
            tempDate.setDate(tempDate.getDate() + 1);
          }
        }
      }
    };

    animateDateSelection();
  }, [checkInDate, checkOutDate]);

  // Scroll Animation Effect
  useEffect(() => {
    if (!scrollElement) return; // Only run if scrollElement is available

    // Animate month headers
    gsap.utils.toArray<HTMLElement>(".month-year-header").forEach((header) => {
      ScrollTrigger.create({
        trigger: header,
        start: "top 80%", // When the top of the header enters 80% of the viewport
        end: "bottom 20%", // When the bottom of the header leaves 20% of the viewport
        toggleActions: "play none none reverse", // Play on enter, reverse on leave
        animation: gsap.fromTo(
          header,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
        ),
        // markers: true, // For debugging
        scroller: scrollElement, // Specify the scrollable element
      });
    });

    // Animate calendar rows as they come into view
    gsap.utils.toArray<HTMLElement>(".calendar-week-row").forEach((row) => {
      ScrollTrigger.create({
        trigger: row,
        start: "top 90%", // When the top of the row enters 90% of the viewport
        end: "bottom 10%", // When the bottom of the row leaves 10% of the viewport
        toggleActions: "play none none reverse",
        animation: gsap.fromTo(
          row,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power1.out" }
        ),
        // markers: true, // For debugging
        scroller: scrollElement, // Specify the scrollable element
      });
    });

    // Ensure ScrollTrigger is refreshed when content changes
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill()); // Clean up ScrollTriggers
    };
  }, [visibleMonths, scrollElement]); // Re-run when visibleMonths or scrollElement changes

  const ionRouter = useIonRouter();

  const handleBack = useCallback(() => {
    ionRouter.goBack();
  }, [ionRouter]);

  const handleApplyDates = useCallback(() => {
    const datesToPass = { checkIn: checkInDate, checkOut: checkOutDate };

    // Call the callback if it exists
    if (onDatesSelectFromState) {
      onDatesSelectFromState(datesToPass);
    }

    // Navigate back, passing the selected dates in the state
    ionRouter.goBack({ state: { selectedDates: datesToPass } });
  }, [onDatesSelectFromState, checkInDate, checkOutDate, ionRouter]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonGrid>
            <IonRow className="calendar-header-row">
              {dayNames.map((day, index) => (
                <IonCol
                  key={`${day}-${index}`}
                  className="calendar-day-col calendar-header-col"
                >
                  <IonText color="medium">
                    <strong>{day}</strong>
                  </IonText>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonHeader>

      <IonContent
        ref={contentRef}
        className="content-with-fixed-footer"
        style={{ "background": "white" }}
      >
        <IonGrid className="ion-padding">
          {visibleMonths.map((month) => (
            <React.Fragment key={month.id}>
              <IonRow>
                <IonCol size="12">
                  <h2 className="month-year-header">
                    {month.name} <strong>{month.year}</strong>
                  </h2>
                </IonCol>
              </IonRow>
              {renderMonth(month)}
            </React.Fragment>
          ))}
        </IonGrid>
      </IonContent>
      <IonFooter className="bottom-date-selection-bar">
        <IonGrid className="ion-no-padding">
          <IonRow className="ion-align-items-center ion-justify-content-between">
            <IonCol size="6">
              <IonButton
                expand="block"
                fill="clear"
                color="dark"
                onClick={handleBack}
              >
                Back
              </IonButton>
            </IonCol>
            <IonCol size="6">
              <IonButton
                expand="block"
                className="apply-dates-button"
                onClick={handleApplyDates}
              >
                Apply Dates
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonFooter>
    </IonPage>
  );
};

export default CustomYearCalendar;
