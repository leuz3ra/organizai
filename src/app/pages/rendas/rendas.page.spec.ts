import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RendasPage } from './rendas.page';

describe('RendasPage', () => {
  let component: RendasPage;
  let fixture: ComponentFixture<RendasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RendasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
