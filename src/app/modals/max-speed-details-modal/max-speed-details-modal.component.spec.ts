import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MaxSpeedDetailsModalComponent } from './max-speed-details-modal.component';

describe('MaxSpeedDetailsModalComponent', () => {
  let component: MaxSpeedDetailsModalComponent;
  let fixture: ComponentFixture<MaxSpeedDetailsModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MaxSpeedDetailsModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MaxSpeedDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
