import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Login } from './login';
import { ToastService } from '../services/toast-service';
import { apiUrl } from '../services/api';

describe('Login - Testy integracyjne', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let router: Router;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    const toastSpy = jasmine.createSpyObj('ToastService', ['show']);

    await TestBed.configureTestingModule({
      imports: [
        Login,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        FormsModule
      ],
      providers: [
        { provide: ToastService, useValue: toastSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    
    spyOn(router, 'navigate'); // Śledzimy wywołania navigate
  });

  afterEach(() => {
    httpMock.verify();
  });

  // TEST 1: Sprawdza cały proces logowania (sukces)
  it('1. Powinien pomyślnie zalogować użytkownika ADMIN', () => {
    // Ustawiamy dane logowania
    component.username = 'admin';
    component.password = 'admin123';
    
    // Wywołujemy metodę login
    component.login();
    
    // Oczekujemy zapytania HTTP POST do /auth/login
    const req = httpMock.expectOne(apiUrl('/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'admin',
      password: 'admin123'
    });
    
    // Symulujemy odpowiedź z serwera (sukces)
    req.flush({ userType: 'ADMIN' });
    
    // Sprawdzamy czy:
    // - zapisano typ użytkownika
    expect(localStorage.getItem('user_type')).toBe('ADMIN');
    // - pokazano toast z sukcesem
    expect(toastService.show).toHaveBeenCalledWith('success', 'Sukces', 'Zalogowano pomyślnie!');
    // - przekierowano do /app/users
    expect(router.navigate).toHaveBeenCalledWith(['/app/users']);
  });

  // TEST 2: Sprawdza obsługę błędu logowania
  it('2. Powinien wyświetlić błąd przy nieprawidłowych danych', () => {
    component.username = 'wrong';
    component.password = 'wrong';
    
    component.login();
    
    const req = httpMock.expectOne(apiUrl('/auth/login'));
    
    // Symulujemy błąd z serwera (401 Unauthorized)
    req.flush(
      { message: 'Nieprawidłowy login lub hasło.' },
      { status: 401, statusText: 'Unauthorized' }
    );
    
    // Sprawdzamy czy pokazano toast z błędem
    expect(toastService.show).toHaveBeenCalledWith(
      'error',
      'Błąd',
      'Nieprawidłowy login lub hasło.'
    );
    // Sprawdzamy czy NIE przekierowano
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // TEST 3: Sprawdza cały proces odzyskiwania hasła
  it('3. Powinien wysłać prośbę o zmianę hasła', () => {
    // Otwieramy modal
    component.openForgotModal();
    
    // Wypełniamy formularz
    component.forgotUsername = 'testuser';
    component.forgotEmail = 'test@example.com';
    
    // Wywołujemy metodę wysyłania
    component.sendForgotPassword();
    
    // Oczekujemy zapytania HTTP POST do /auth/reports
    const req = httpMock.expectOne(apiUrl('/auth/reports'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'testuser',
      email: 'test@example.com',
      content: 'Proszę o zmianę hasła',
      type: 'PASSWORD'
    });
    
    // Symulujemy odpowiedź sukcesu
    req.flush({});
    
    // Sprawdzamy czy:
    // - pokazano toast sukcesu
    expect(toastService.show).toHaveBeenCalledWith(
      'success',
      'Sukces',
      'Prośba o zmianę hasła została wysłana!'
    );
    // - modal został zamknięty
    expect(component.showForgotModal).toBeFalse();
    // - dane zostały wyczyszczone
    expect(component.forgotUsername).toBe('');
    expect(component.forgotEmail).toBe('');
  });
});