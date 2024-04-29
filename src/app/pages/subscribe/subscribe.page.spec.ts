import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubscribePage } from './subscribe.page';

describe('SubscribePage', () => {
  let component: SubscribePage;
  let fixture: ComponentFixture<SubscribePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SubscribePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
