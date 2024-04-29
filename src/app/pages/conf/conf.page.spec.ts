import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfPage } from './conf.page';

describe('ConfPage', () => {
  let component: ConfPage;
  let fixture: ComponentFixture<ConfPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
