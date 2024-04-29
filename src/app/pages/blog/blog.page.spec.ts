import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogPage } from './blog.page';

describe('BlogPage', () => {
  let component: BlogPage;
  let fixture: ComponentFixture<BlogPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
