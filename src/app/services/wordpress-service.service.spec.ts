import { TestBed } from '@angular/core/testing';

import { beforeEach, describe, it } from 'node:test';
import { WordpressService } from './wordpress-service.service';

describe('WordpressServiceService', () => {
  let service: WordpressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WordpressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
