import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Login } from './login';
import { ToastService } from '../services/toast-service';

describe('Login - Testy jednostkowe', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    const toastSpy = jasmine.createSpyObj('ToastService', ['show']);

    await TestBed.configureTestingModule({
      imports: [
        Login,
        FormsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ToastService, useValue: toastSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('1. Powinien utworzyć komponent', () => {
    expect(component).toBeTruthy();
  });

  it('2. Powinien otworzyć modal zapomnienia hasła', () => {
    expect(component.showForgotModal).toBeFalse();
  
    component.openForgotModal();
    
    expect(component.showForgotModal).toBeTrue();
  });

  it('3. Powinien zamknąć modal i wyczyścić dane', () => {
    component.showForgotModal = true;
    component.forgotUsername = 'testuser';
    component.forgotEmail = 'test@example.com';
    
    component.closeForgotModal();
    
    expect(component.showForgotModal).toBeFalse();
    expect(component.forgotUsername).toBe('');
    expect(component.forgotEmail).toBe('');
  });
});