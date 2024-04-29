import { TestBed } from '@angular/core/testing';

import { SensorFusionService } from './sensor-fusion.service';

describe('SensorFusionService', () => {
  let service: SensorFusionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SensorFusionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
