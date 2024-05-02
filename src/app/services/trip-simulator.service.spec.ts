import { TestBed } from '@angular/core/testing';

import { TripSimulatorService } from './trip-simulator.service';

describe('TripSimulatorService', () => {
  let service: TripSimulatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TripSimulatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
