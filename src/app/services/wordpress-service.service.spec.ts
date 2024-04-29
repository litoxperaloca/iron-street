import { TestBed } from '@angular/core/testing';

import { WordpressServiceService } from './wordpress-service.service';

describe('WordpressServiceService', () => {
  let service: WordpressServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WordpressServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
