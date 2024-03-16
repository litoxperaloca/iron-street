import { TestBed } from '@angular/core/testing';

import { LocalNotificationsService } from './local-notifications.service';

describe('LocalNotificationsService', () => {
  let service: LocalNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
