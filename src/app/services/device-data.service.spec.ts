import { TestBed } from '@angular/core/testing';

import { DeviceDataService } from './device-data.service';

describe('DeviceDataService', () => {
  let service: DeviceDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
