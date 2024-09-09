import { TestBed } from '@angular/core/testing';

import { SourceAndLayerManagerService } from './source-and-layer-manager.service';

describe('SourceAndLayerManagerService', () => {
  let service: SourceAndLayerManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SourceAndLayerManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
