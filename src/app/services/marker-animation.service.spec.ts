import { TestBed } from '@angular/core/testing';

import { MarkerAnimationService } from './marker-animation.service';

describe('MarkerAnimationService', () => {
  let service: MarkerAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarkerAnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
