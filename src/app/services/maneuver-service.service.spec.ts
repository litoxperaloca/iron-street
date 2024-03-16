import { TestBed } from '@angular/core/testing';

import { ManeuverService } from './maneuver-service.service';

describe('ManeuverService', () => {
  let service: ManeuverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManeuverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
