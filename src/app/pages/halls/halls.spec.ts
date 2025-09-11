import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Halls } from './halls';

describe('Halls', () => {
  let component: Halls;
  let fixture: ComponentFixture<Halls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Halls]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Halls);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
