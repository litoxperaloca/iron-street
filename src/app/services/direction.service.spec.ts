import { TestBed } from '@angular/core/testing';

import { DirectionService } from './direction.service';

describe('DirectionService', () => {
  let service: DirectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DirectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
