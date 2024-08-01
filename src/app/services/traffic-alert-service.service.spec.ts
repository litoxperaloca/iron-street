import { TestBed } from '@angular/core/testing';

import { TrafficAlertServiceService } from './traffic-alert-service.service';

describe('TrafficAlertServiceService', () => {
  let service: TrafficAlertServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrafficAlertServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
