import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, startOfWeek, addWeeks, eachWeekOfInterval, isAfter, isBefore, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export function useAutoWeeklyPay() {
  const queryClient = useQueryClient();

  useEffect(() => {
    async function run() {
      const schedules = await base44.entities.AutoPaySchedule.filter({ active: true });
      if (!schedules.length) return;

      const today = new Date();
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });

      let didCreate = false;

      for (const schedule of schedules) {
        const start = parseISO(schedule.start_date);
        const lastCreated = schedule.last_created_date ? parseISO(schedule.last_created_date) : null;

        // Determine the effective end date
        const endDate = schedule.end_mode === "end_date" && schedule.end_date
          ? parseISO(schedule.end_date)
          : null;

        // If end date has passed, deactivate
        if (endDate && isAfter(thisWeekStart, endDate)) {
          await base44.entities.AutoPaySchedule.update(schedule.id, { active: false });
          continue;
        }

        // Figure out which weeks we need to create (from start up to thisWeekStart)
        const rangeEnd = endDate && isBefore(endDate, thisWeekStart) ? endDate : thisWeekStart;
        const rangeStart = lastCreated ? addWeeks(lastCreated, 1) : start;

        if (isAfter(rangeStart, rangeEnd)) continue;

        const weeksToCreate = eachWeekOfInterval(
          { start: rangeStart, end: rangeEnd },
          { weekStartsOn: 1 }
        );

        if (!weeksToCreate.length) continue;

        const entries = weeksToCreate.map((weekStart) => ({
          date: format(weekStart, "yyyy-MM-dd"),
          week_label: `Week of ${format(weekStart, "MMM d, yyyy")}`,
          amount: schedule.amount,
          notes: schedule.notes || "",
          ...(schedule.job_id ? { job_id: schedule.job_id } : {}),
        }));

        await base44.entities.WeeklyPay.bulkCreate(entries);
        await base44.entities.AutoPaySchedule.update(schedule.id, {
          last_created_date: format(weeksToCreate[weeksToCreate.length - 1], "yyyy-MM-dd"),
        });
        didCreate = true;
      }

      if (didCreate) {
        queryClient.invalidateQueries({ queryKey: ["weeklyPays"] });
      }
    }

    run();
  }, []);
}
