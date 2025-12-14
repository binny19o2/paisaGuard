import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileComponents } from './profile-components';

describe('ProfileComponents', () => {
  let component: ProfileComponents;
  let fixture: ComponentFixture<ProfileComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
