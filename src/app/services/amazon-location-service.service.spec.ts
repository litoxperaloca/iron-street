import { TestBed } from '@angular/core/testing';

import { AmazonLocationServiceService } from './amazon-location-service.service';

describe('AmazonLocationServiceService', () => {
  let service: AmazonLocationServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmazonLocationServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
