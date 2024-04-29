import { TestBed } from '@angular/core/testing';

import { ActionSheetService } from './action-sheet.service';

describe('ActionSheetService', () => {
  let service: ActionSheetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActionSheetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
