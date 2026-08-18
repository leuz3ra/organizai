import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NovoInvestimentoPage } from './novo-investimento.page';

describe('NovoInvestimentoPage', () => {
  let component: NovoInvestimentoPage;
  let fixture: ComponentFixture<NovoInvestimentoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NovoInvestimentoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
