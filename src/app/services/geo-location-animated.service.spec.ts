import { TestBed } from '@angular/core/testing';

import { GeoLocationAnimatedService } from './geo-location-animated.service';

describe('GeoLocationAnimatedService', () => {
  let service: GeoLocationAnimatedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoLocationAnimatedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
