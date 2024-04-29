import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RewardsPage } from './rewards.page';

describe('RewardsPage', () => {
  let component: RewardsPage;
  let fixture: ComponentFixture<RewardsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RewardsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
