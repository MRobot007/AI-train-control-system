export interface Train {
  id: string;
  number: string;
  name: string;
  type: 'passenger' | 'express' | 'freight';
  priority: number;
  status: 'on-time' | 'delayed' | 'early';
  currentStation: string;
  nextStation: string;
  speed: number;
  maxSpeed: number;
  delay: number;
  route: string[];
  departureTime: string;
  arrivalTime: string;
  position: { x: number; y: number };
}

export interface Station {
  id: string;
  name: string;
  code: string;
  platforms: number;
  position: { x: number; y: number };
  type: 'junction' | 'terminal' | 'halt';
  hasLoop: boolean;
}

export interface Conflict {
  id: string;
  type: 'section-overlap' | 'platform-conflict' | 'maintenance-block';
  severity: 'low' | 'medium' | 'high' | 'critical';
  trains: string[];
  location: string;
  resolvedBy: string;
  suggestion: string;
  timestamp: string;
}

// Function to generate random speed based on train type
export const getRandomSpeed = (trainType: 'passenger' | 'express' | 'freight'): number => {
  switch (trainType) {
    case 'express':
      return Math.floor(Math.random() * 40) + 100; // 100-140 km/h
    case 'passenger':
      return Math.floor(Math.random() * 30) + 70;  // 70-100 km/h
    case 'freight':
      return Math.floor(Math.random() * 25) + 50;  // 50-75 km/h
    default:
      return Math.floor(Math.random() * 30) + 70;
  }
};

export const mockStations: Station[] = [
  { id: 'ST001', name: 'Ahmedabad Junction', code: 'ADI', platforms: 8, position: { x: 400, y: 300 }, type: 'junction', hasLoop: true },
  { id: 'ST002', name: 'Mehsana', code: 'MSH', platforms: 2, position: { x: 350, y: 250 }, type: 'halt', hasLoop: false },
  { id: 'ST003', name: 'Vadodara Junction', code: 'BRC', platforms: 6, position: { x: 450, y: 350 }, type: 'junction', hasLoop: true },
];

export const mockTrains: Train[] = [
  {
    id: 'T001',
    number: '12901',
    name: 'Mehsana Express',
    type: 'express',
    priority: 1,
    status: 'on-time',
    currentStation: 'ST002',
    nextStation: 'ST001',
    speed: getRandomSpeed('express'),
    maxSpeed: 140,
    delay: 0,
    route: ['ST002', 'ST001'],
    departureTime: '06:00',
    arrivalTime: '07:30',
    position: { x: 350, y: 250 }
  },
  {
    id: 'T002',
    number: '12902',
    name: 'Ahmedabad-Vadodara Fast',
    type: 'express',
    priority: 2,
    status: 'on-time',
    currentStation: 'ST001',
    nextStation: 'ST003',
    speed: getRandomSpeed('express'),
    maxSpeed: 130,
    delay: 0,
    route: ['ST001', 'ST003'],
    departureTime: '08:30',
    arrivalTime: '10:00',
    position: { x: 400, y: 300 }
  },
  {
    id: 'T003',
    number: '59001',
    name: 'Mehsana Passenger',
    type: 'passenger',
    priority: 3,
    status: 'delayed',
    currentStation: 'ST002',
    nextStation: 'ST001',
    speed: getRandomSpeed('passenger'),
    maxSpeed: 100,
    delay: 15,
    route: ['ST002', 'ST001'],
    departureTime: '11:15',
    arrivalTime: '13:00',
    position: { x: 350, y: 250 }
  },
  {
    id: 'T004',
    number: '59002',
    name: 'Local Service',
    type: 'passenger',
    priority: 3,
    status: 'on-time',
    currentStation: 'ST001',
    nextStation: 'ST003',
    speed: getRandomSpeed('passenger'),
    maxSpeed: 95,
    delay: 0,
    route: ['ST001', 'ST003'],
    departureTime: '14:45',
    arrivalTime: '16:45',
    position: { x: 400, y: 300 }
  },
  {
    id: 'T005',
    number: '59401',
    name: 'Freight Train',
    type: 'freight',
    priority: 4,
    status: 'delayed',
    currentStation: 'ST001',
    nextStation: 'ST003',
    speed: getRandomSpeed('freight'),
    maxSpeed: 80,
    delay: 25,
    route: ['ST001', 'ST003'],
    departureTime: '16:20',
    arrivalTime: '18:30',
    position: { x: 400, y: 300 }
  },
  {
    id: 'T006',
    number: '59402',
    name: 'Goods Express',
    type: 'freight',
    priority: 4,
    status: 'on-time',
    currentStation: 'ST002',
    nextStation: 'ST001',
    speed: getRandomSpeed('freight'),
    maxSpeed: 75,
    delay: 0,
    route: ['ST002', 'ST001'],
    departureTime: '19:30',
    arrivalTime: '21:45',
    position: { x: 350, y: 250 }
  }
];

export const mockConflicts: Conflict[] = [
  {
    id: 'C001',
    type: 'section-overlap',
    severity: 'high',
    trains: ['12901', '59401'],
    location: 'Section MSH-ADI (KM 25-30)',
    resolvedBy: 'AI Optimizer',
    suggestion: 'Delay freight train by 12 minutes to avoid Mehsana Express conflict',
    timestamp: '14:23:15'
  },
  {
    id: 'C002',
    type: 'platform-conflict',
    severity: 'medium',
    trains: ['12902', '59001'],
    location: 'Ahmedabad Junction Platform 2',
    resolvedBy: 'Manual Override',
    suggestion: 'Reassign Ahmedabad-Vadodara Fast to Platform 3',
    timestamp: '14:18:42'
  },
  {
    id: 'C003',
    type: 'section-overlap',
    severity: 'low',
    trains: ['59002', '59402'],
    location: 'Section ADI-BRC (KM 40-45)',
    resolvedBy: 'AI Optimizer',
    suggestion: 'Minor speed adjustment for Local Service to maintain safe distance',
    timestamp: '14:15:33'
  },
  {
    id: 'C004',
    type: 'platform-conflict',
    severity: 'medium',
    trains: ['59001', '59401'],
    location: 'Vadodara Junction Platform 4',
    resolvedBy: 'AI Optimizer',
    suggestion: 'Reassign freight train to Platform 6, delay by 5 minutes',
    timestamp: '14:25:33'
  }
];