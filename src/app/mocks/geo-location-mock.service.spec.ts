import { TestBed } from '@angular/core/testing';

import { GeoLocationMockService } from './geo-location-mock.service';

describe('GeoLocationMockService', () => {
  let service: GeoLocationMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoLocationMockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
