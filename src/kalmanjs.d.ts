declare module 'kalmanjs' {
  interface KalmanFilterOptions {
    R?: number; // Error covariance
    Q?: number; // Process noise covariance
    A?: number;
    B?: number;
    C?: number;
  }

  export default class KalmanFilter {
    constructor(options?: KalmanFilterOptions);
    filter(z: number, u?: number): number;
    lastMeasurement(): number;
    predict(u?: number): number;
    random(): number;
  }
}
