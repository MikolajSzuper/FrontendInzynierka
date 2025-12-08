import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    
    spyOn(router, 'navigate');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('1. Powinien pomyślnie zalogować użytkownika ADMIN', () => {
    component.username = 'admin';
    component.password = 'admin123';
    
    component.login();
    
    const req = httpMock.expectOne(apiUrl('/auth/login'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'admin',
      password: 'admin123'
    });
    
    req.flush({ userType: 'ADMIN' });
    
    expect(localStorage.getItem('user_type')).toBe('ADMIN');
    expect(toastService.show).toHaveBeenCalledWith('success', 'Sukces', 'Zalogowano pomyślnie!');
    expect(router.navigate).toHaveBeenCalledWith(['/app/users']);
  });

  it('2. Powinien wyświetlić błąd przy nieprawidłowych danych', () => {
    component.username = 'wrong';
    component.password = 'wrong';
    
    component.login();
    
    const req = httpMock.expectOne(apiUrl('/auth/login'));
    
    req.flush(
      { message: 'Nieprawidłowy login lub hasło.' },
      { status: 401, statusText: 'Unauthorized' }
    );
    
    expect(toastService.show).toHaveBeenCalledWith('error','Błąd','Nieprawidłowy login lub hasło.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('3. Powinien wysłać prośbę o zmianę hasła', () => {
    component.openForgotModal();
    
    component.forgotUsername = 'testuser';
    component.forgotEmail = 'test@example.com';
    
    component.sendForgotPassword();
    
    const req = httpMock.expectOne(apiUrl('/auth/reports'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'testuser',
      email: 'test@example.com',
      content: 'Proszę o zmianę hasła',
      type: 'PASSWORD'
    });
    
    req.flush({});
    
    expect(toastService.show).toHaveBeenCalledWith('success','Sukces','Prośba o zmianę hasła została wysłana!');
    expect(component.showForgotModal).toBeFalse();
    expect(component.forgotUsername).toBe('');
    expect(component.forgotEmail).toBe('');
  });
});