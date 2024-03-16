import { TestBed } from '@angular/core/testing';

import { DeviceOrientationService } from './device-orientation.service';

describe('DeviceOrientationService', () => {
  let service: DeviceOrientationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceOrientationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
