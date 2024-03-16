import { TestBed } from '@angular/core/testing';

import { SpeedService } from './speed.service';

describe('SpeedService', () => {
  let service: SpeedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
