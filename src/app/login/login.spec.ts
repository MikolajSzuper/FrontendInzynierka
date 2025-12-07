import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { Login } from './login';
import { ToastService } from '../services/toast-service';
import { apiUrl } from '../services/api';

describe('Login - Testy jednostkowe', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    // Tworzymy mock (imitację) ToastService
    const toastSpy = jasmine.createSpyObj('ToastService', ['show']);

    await TestBed.configureTestingModule({
      imports: [
        Login,
        HttpClientTestingModule, // Mock dla HTTP
        RouterTestingModule, // Mock dla Router
        FormsModule
      ],
      providers: [
        { provide: ToastService, useValue: toastSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  afterEach(() => {
    // Sprawdzamy czy wszystkie requesty HTTP zostały obsłużone
    httpMock.verify();
  });

  // TEST 1: Sprawdza czy komponent się tworzy
  it('1. Powinien utworzyć komponent', () => {
    expect(component).toBeTruthy();
  });

  // TEST 2: Sprawdza czy metoda openForgotModal() działa
  it('2. Powinien otworzyć modal zapomnienia hasła', () => {
    // Na początku modal jest zamknięty
    expect(component.showForgotModal).toBeFalse();
    
    // Wywołujemy metodę
    component.openForgotModal();
    
    // Modal powinien być teraz otwarty
    expect(component.showForgotModal).toBeTrue();
  });

  // TEST 3: Sprawdza czy metoda closeForgotModal() czyści dane
  it('3. Powinien zamknąć modal i wyczyścić dane', () => {
    // Ustawiamy dane w formularzu
    component.showForgotModal = true;
    component.forgotUsername = 'testuser';
    component.forgotEmail = 'test@example.com';
    
    // Wywołujemy metodę zamykającą
    component.closeForgotModal();
    
    // Sprawdzamy czy wszystko zostało wyczyszczone
    expect(component.showForgotModal).toBeFalse();
    expect(component.forgotUsername).toBe('');
    expect(component.forgotEmail).toBe('');
  });
});