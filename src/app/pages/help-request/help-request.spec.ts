import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpRequest } from './help-request';

describe('HelpRequest', () => {
  let component: HelpRequest;
  let fixture: ComponentFixture<HelpRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpRequest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
