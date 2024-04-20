import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { SignupSigninPage } from './signup-signin.page';

describe('SignupSigninPage', () => {
  let component: SignupSigninPage;
  let fixture: ComponentFixture<SignupSigninPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SignupSigninPage],
      imports: [IonicModule.forRoot(), RouterModule.forRoot([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SignupSigninPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
