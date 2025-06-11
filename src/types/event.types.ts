import { EventType, EventCategory, LocationType } from "../../generated/prisma";

export type Speaker = {
  id: string;
  name: string;
  profession?: string;
  linkedin?: string;
  twitter?: string;
  avatar?: string;
  type: string;
  eventId: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type Event = {
  id: string;
  name: string;
  description: string;
  poster?: string;
  type: EventType;
  category: EventCategory;
  startTime: Date;
  duration: number;
  location: LocationType;
  completeAddress: string;
  latitude?: number | null;
  longitude?: number | null;
  hosts: Speaker[];
  guests: Speaker[];
  isPaid: boolean;
  seats: number;
  ticketPrice: number[];
  accountNumber?: string;
  accountName?: string;
  IFSCCode?: string;
  termsConditions?: string;
  userId?: string;
  createdAt: Date;
  updatedAt?: Date;
};
