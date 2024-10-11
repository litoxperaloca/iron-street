import { TestBed } from '@angular/core/testing';

import { ValhallaDirectionsApiService } from './valhalla-directions-api.service';

describe('ValhallaDirectionsApiService', () => {
  let service: ValhallaDirectionsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValhallaDirectionsApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
