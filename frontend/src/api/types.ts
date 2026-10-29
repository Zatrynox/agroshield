export type Role = 'owner' | 'admin' | 'agronomist' | 'operator' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export interface Session {
  user: User;
  organization: Organization;
  role: Role;
  csrfToken: string;
  expiresAt: string;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  areaHectares: number;
  zonesCount: number;
  createdAt: string;
}

export interface Zone {
  id: string;
  farmId: string;
  name: string;
  cropType: string;
  areaHectares: number;
  createdAt: string;
}

export interface FarmDetail {
  farm: Farm;
  zones: Zone[];
}

export interface ZoneDetail {
  zone: Zone;
  farm: { id: string; name: string; location: string };
}

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType = 'temperature' | 'pest' | 'nutrients';

export interface Alert {
  id: string;
  zoneId: string;
  zoneName: string;
  farmName: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  deadlineAt: string;
  createdAt: string;
  acknowledgedAt: string | null;
  isOverdue: boolean;
  context: Record<string, unknown>;
}

export interface Sensor {
  id: string;
  zoneId: string;
  name: string;
  status: 'active' | 'revoked';
  keyVersion: number;
  fingerprint: string;
  createdAt: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
}

export interface SensorWithKey {
  sensor: Sensor;
  privateKeyPem: string;
  notice: string;
}

export interface Reading {
  id: string;
  sensorId: string;
  clientReadingId: string;
  recordedAt: string;
  soilTempC: number;
  moisturePct: number;
  ph: number;
  nitrogenMgKg: number;
  phosphorusMgKg: number;
  potassiumMgKg: number;
  conductivityMsCm: number;
  pestIndex: number;
}

export interface SoilAssessment {
  score: number;
  status: 'healthy' | 'watch' | 'depleted';
  limitingNutrient: 'nitrogen' | 'phosphorus' | 'potassium' | null;
  daysRemaining: number;
  factors: {
    moisture: number;
    ph: number;
    nutrients: number;
    pest: number;
  };
  recommendation: string;
  readingAt: string;
}

export interface SoilHealth {
  zoneId: string;
  assessment: SoilAssessment | null;
  source: 'sensor-readings';
}

export interface ForecastDay {
  date: string;
  soilTempC: number;
  moisturePct: number;
}

export interface ZoneForecast {
  zoneId: string;
  source: 'demo-trend-model';
  demo: true;
  basisReadings: number;
  generatedAt: string;
  days: ForecastDay[];
}

export type ZoneRisk = 'low' | 'medium' | 'high' | 'unknown';

export interface ZonePrediction {
  zoneId: string;
  risk: ZoneRisk;
  incidentZone: boolean;
  score: number | null;
  recommendation: string;
  signals: string[];
  source: 'rules-v1';
  demo: true;
}

export interface OrganizationDetail {
  organization: Organization & {
    createdAt: string;
    membersCount: number;
  };
  members: Array<{
    userId: string;
    name: string;
    email: string;
    role: Role;
    createdAt: string;
  }>;
}

export interface CaptchaChallenge {
  challenge: string;
  difficulty: number;
  expiresAt: string;
}

export interface LeadResult {
  id: string;
  receivedAt: string;
}

export interface Health {
  status: 'ok' | 'degraded';
  database: string;
  demoMode: boolean;
  version: string;
  timestamp: string;
}
