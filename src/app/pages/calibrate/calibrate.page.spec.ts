import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalibratePage } from './calibrate.page';

describe('CalibratePage', () => {
  let component: CalibratePage;
  let fixture: ComponentFixture<CalibratePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CalibratePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
