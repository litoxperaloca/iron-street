import { TestBed } from '@angular/core/testing';

import { VertexAIService } from './vertex-ai.service';

describe('VertexAIService', () => {
  let service: VertexAIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VertexAIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
