import { TestBed } from '@angular/core/testing';

import { BackgroundRunnerService } from './background-runner.service';

describe('BackgroundRunnerService', () => {
  let service: BackgroundRunnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackgroundRunnerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
