"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import type { Appointment } from "../../lib/types";

export type DragDropCalendarProps = {
  appointments: Appointment[];
  onMove: (appointmentId: string, date: string) => void;
};

export const DragDropCalendar = ({ appointments, onMove }: DragDropCalendarProps): JSX.Element => {
  const handleDragEnd = (result: DropResult): void => {
    if (result.destination === null || result.destination === undefined) {
      return;
    }

    onMove(result.draggableId, result.destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid gap-3 md:grid-cols-3">
        {["Hoje", "Amanhã", "Semana"].map((column) => (
          <Droppable droppableId={column} key={column}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-48 rounded-md border border-clinic-border bg-clinic-bg p-3">
                <h3 className="mb-3 font-medium text-clinic-text">{column}</h3>
                {appointments.map((appointment, index) => (
                  <Draggable key={appointment.id} draggableId={appointment.id} index={index}>
                    {(dragProvided) => (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps} className="mb-2 rounded-md bg-clinic-surface p-3 text-sm shadow-sm">
                        {appointment.time} · {appointment.patientName}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

