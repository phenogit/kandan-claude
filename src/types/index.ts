// src/types/index.ts
import { ObjectId } from "mongodb";

// User Types
export interface User {
  _id: ObjectId;
  username: string;
  email: string;
  displayName?: string;
  passwordHash?: string;
  authProvider: "local" | "google" | "facebook" | "apple";
  authProviderId?: string;
  bio?: string;
  avatarUrl?: string;
  userType: "native";
  isReadOnly: false;
  emailVerified: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface LegacyUser {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  totalPredictionCount: number;
  finishedPredictionCount: number;
  ongoingPredictionCount: number;
  successPredictionCount: number;
  failPredictionCount: number;
  profitRate: number;
  avgProfitRate: number;
  absProfit: number;
  avgAbsProfit: number;
  confidenceProfit: number;
  avgConfidenceProfit: number;
  trophy: number;
  avgTrophy: number;
  currentStreak: number;
  highestStreak: number;
  highestTrophy: number;
  level: number;
  experience: number;
  subscribers: string[];
  createTime: Date;
  lastModifiedTime: Date;
}

// Prediction Types
export type PredictionStatus =
  | "pending"
  | "auto-success"
  | "manual-success"
  | "auto-fail"
  | "manual-fail";

export type Direction = 1 | -1; // 1 = bull, -1 = bear

export type InstrumentType = "stock" | "etf" | "warrant" | "bond";

export interface Prediction {
  _id: ObjectId;
  userId: ObjectId;

  // Stock info
  ticker: string;
  tickerName: string;
  market: string;
  instrumentType: InstrumentType;

  // Prediction details
  direction: Direction;
  ceiling: number;
  floor: number;
  confidence: number; // 1-5

  // Daily high/low at creation (for validation reference)
  creationDailyHigh: number;
  creationDailyLow: number;

  // Timing
  startTime: Date;

  // Prices
  startPrice: number;
  startPriceSource: string;
  currentPrice?: number;
  currentPriceUpdatedAt?: Date;
  endPrice?: number;

  // Content
  rationale?: string;

  // Status
  status: PredictionStatus;
  resolvedAt?: Date;

  // Following relationship
  basedOnPredictionId?: ObjectId;
  isFollowedPrediction: boolean;

  // Performance metrics
  profitRate?: number;
  profitRateAdjustedByConfidence?: number;
  profitAmount?: number;

  // Visibility
  isPublic: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface LegacyPrediction {
  _id: ObjectId;
  userName: string;
  stockId: string;
  stockName: string;
  bearOrBull: number;
  confidence: number;
  lowPrice: number;
  highPrice: number;
  startTime: Date;
  endTime?: Date;
  startPriceTime: Date;
  startPrice: string;
  startPriceSource: string;
  endPrice?: number;
  currentPrice: string;
  currentPriceUpdateTime: Date;
  isCompleted: boolean;
  profitRate?: number;
  absProfit?: number;
  confidenceProfit?: number;
  trophy?: number;
  followers: string[];
}

// Subscription Types
export interface Subscription {
  _id: ObjectId;
  subscriberId: ObjectId;
  subscribedToId: ObjectId;
  subscribedToType: "native" | "legacy";
  subscribedToLegacyId?: ObjectId;
  createdAt: Date;
}

// Statistics Types
export interface UserStats {
  _id: ObjectId;
  userId: ObjectId;

  totalPredictions: number;
  pendingPredictions: number;
  resolvedPredictions: number;
  successfulPredictions: number;
  failedPredictions: number;

  originalPredictions: number;
  followedPredictions: number;

  accuracyRate: number;
  avgProfitRate: number;
  avgProfitRateAdjustedByConfidence: number;

  currentStreak: number;
  highestStreak: number;

  subscriberCount: number;
  subscribedToCount: number;
  predictionFollowCount: number;

  updatedAt: Date;
}

// Notification Types
export type NotificationType =
  | "prediction_resolved"
  | "followed_prediction_settled"
  | "new_subscriber"
  | "prediction_followed";

export interface Notification {
  _id: ObjectId;
  userId: ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedPredictionId?: ObjectId;
  relatedUserId?: ObjectId;
  isRead: boolean;
  readAt?: Date;
  sentViaEmail: boolean;
  sentViaPush: boolean;
  createdAt: Date;
}

// Stock Data Types
export interface Stock {
  ticker: string;
  name: string;
  nameEn?: string;
  market: "twse" | "tpex";
  type: InstrumentType;
}

export interface StockPrice {
  ticker: string;
  current: number;
  dailyHigh: number;
  dailyLow: number;
  source: "yahoo_tw" | "finnhub";
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Form Types
export interface CreatePredictionForm {
  ticker: string;
  tickerName: string;
  market: string;
  instrumentType: InstrumentType;
  direction: Direction;
  ceiling: number;
  floor: number;
  confidence: number;
  rationale?: string;
}

export interface FollowPredictionForm {
  predictionId: string;
  customRationale?: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

// Transformed Types (for unified display)
export interface UnifiedUser {
  _id: string;
  username: string;
  displayName: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  userType: "native" | "legacy";
  isReadOnly: boolean;
  createdAt: Date;
  stats: {
    totalPredictions: number;
    successfulPredictions: number;
    failedPredictions: number;
    accuracyRate: number;
    avgProfitRate: number;
    avgProfitRateAdjustedByConfidence?: number;
    currentStreak: number;
    highestStreak: number;
    subscriberCount: number;
    subscribedToCount: number;
  };
}

export interface UnifiedPrediction {
  _id: string;
  userId?: string;
  userName: string;
  userType: "native" | "legacy";

  ticker: string;
  tickerName: string;
  market: string;
  instrumentType?: InstrumentType;

  direction: Direction;
  ceiling: number;
  floor: number;
  confidence: number;

  startTime: Date;
  startPrice: number;
  currentPrice?: number;
  endPrice?: number;

  status: string;
  isCompleted: boolean;
  resolvedAt?: Date;

  rationale?: string;

  basedOnPredictionId?: string;
  isFollowedPrediction?: boolean;

  profitRate?: number;
  profitRateAdjustedByConfidence?: number;

  isLegacy: boolean;
  createdAt: Date;
}
