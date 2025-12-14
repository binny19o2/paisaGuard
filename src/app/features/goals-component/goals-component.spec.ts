import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalsComponent } from './goals-component';
import { NavbarComponent } from '../../shared/components/navbar-component/navbar-component';

describe('GoalsComponent', () => {
  let component: GoalsComponent;
  let fixture: ComponentFixture<GoalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoalsComponent,NavbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
