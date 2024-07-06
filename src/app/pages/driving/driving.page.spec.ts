import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrivingPage } from './driving.page';

describe('DrivingPage', () => {
  let component: DrivingPage;
  let fixture: ComponentFixture<DrivingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DrivingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
